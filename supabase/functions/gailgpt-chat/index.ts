import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.39.0'
import { tools, handleToolCall, SYSTEM_PROMPT } from './tools.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify user is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the JWT token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      console.error('Auth error:', authError?.message || 'No user found')
      return new Response(
        JSON.stringify({ error: authError?.message || 'Unauthorized - no user found' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    console.log('Authenticated user:', user.id)

    // Get the Anthropic API key
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicApiKey) {
      return new Response(
        JSON.stringify({ error: 'Anthropic API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { messages, conversationId } = await req.json()

    const anthropic = new Anthropic({
      apiKey: anthropicApiKey,
    })

    // Create streaming response
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Make initial API call with extended thinking
          let currentMessages = [...messages]
          let continueLoop = true

          while (continueLoop) {
            const response = await anthropic.messages.create({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 16000,
              thinking: {
                type: 'enabled',
                budget_tokens: 10000,
              },
              system: SYSTEM_PROMPT,
              tools: tools,
              messages: currentMessages,
              stream: true,
            })

            let currentToolUseId = ''
            let currentToolName = ''
            let currentToolInput = ''
            let hasToolUse = false
            const toolResults: any[] = []
            const contentBlocks: any[] = []  // Accumulate content blocks during streaming

            for await (const event of response) {
              if (event.type === 'content_block_start') {
                if (event.content_block.type === 'thinking') {
                  controller.enqueue(encoder.encode(
                    `data: ${JSON.stringify({ type: 'thinking_start' })}\n\n`
                  ))
                } else if (event.content_block.type === 'text') {
                  // Start collecting text block
                  contentBlocks.push({ type: 'text', text: '' })
                } else if (event.content_block.type === 'tool_use') {
                  hasToolUse = true
                  currentToolUseId = event.content_block.id
                  currentToolName = event.content_block.name
                  currentToolInput = ''
                  // Add tool_use block to contentBlocks (will update input later)
                  contentBlocks.push({
                    type: 'tool_use',
                    id: currentToolUseId,
                    name: currentToolName,
                    input: {}
                  })
                  controller.enqueue(encoder.encode(
                    `data: ${JSON.stringify({
                      type: 'tool_start',
                      tool: currentToolName,
                      id: currentToolUseId
                    })}\n\n`
                  ))
                }
              } else if (event.type === 'content_block_delta') {
                if (event.delta.type === 'thinking_delta') {
                  controller.enqueue(encoder.encode(
                    `data: ${JSON.stringify({
                      type: 'thinking_delta',
                      text: event.delta.thinking
                    })}\n\n`
                  ))
                } else if (event.delta.type === 'text_delta') {
                  // Accumulate text in the last text block
                  const lastTextBlock = contentBlocks.filter(b => b.type === 'text').pop()
                  if (lastTextBlock) {
                    lastTextBlock.text += event.delta.text
                  }
                  controller.enqueue(encoder.encode(
                    `data: ${JSON.stringify({
                      type: 'text_delta',
                      text: event.delta.text
                    })}\n\n`
                  ))
                } else if (event.delta.type === 'input_json_delta') {
                  currentToolInput += event.delta.partial_json
                }
              } else if (event.type === 'content_block_stop') {
                // If we just finished a tool_use block, execute the tool
                if (currentToolUseId && currentToolName) {
                  // Update the tool_use block in contentBlocks with parsed input
                  const toolBlock = contentBlocks.find(b => b.type === 'tool_use' && b.id === currentToolUseId)
                  const parsedInput = currentToolInput ? JSON.parse(currentToolInput) : {}
                  if (toolBlock) {
                    toolBlock.input = parsedInput
                  }

                  try {
                    const result = await handleToolCall(currentToolName, parsedInput, supabaseClient, user.id, conversationId)

                    // Send tool completion event
                    controller.enqueue(encoder.encode(
                      `data: ${JSON.stringify({
                        type: 'tool_complete',
                        id: currentToolUseId,
                        result: result.summary || 'Completed'
                      })}\n\n`
                    ))

                    // If there's an artifact, send it
                    if (result.artifact) {
                      controller.enqueue(encoder.encode(
                        `data: ${JSON.stringify({
                          type: 'artifact',
                          artifact: result.artifact
                        })}\n\n`
                      ))
                    }

                    toolResults.push({
                      type: 'tool_result',
                      tool_use_id: currentToolUseId,
                      content: JSON.stringify(result.data || result),
                    })
                  } catch (toolError) {
                    toolResults.push({
                      type: 'tool_result',
                      tool_use_id: currentToolUseId,
                      content: JSON.stringify({ error: toolError.message }),
                      is_error: true,
                    })
                  }

                  currentToolUseId = ''
                  currentToolName = ''
                  currentToolInput = ''
                }
              } else if (event.type === 'message_stop') {
                // Check if we need to continue the conversation with tool results
                if (hasToolUse && toolResults.length > 0) {
                  // Add assistant message and tool results to messages
                  // Use accumulated contentBlocks instead of response.content
                  currentMessages = [
                    ...currentMessages,
                    {
                      role: 'assistant',
                      content: contentBlocks,
                    },
                    {
                      role: 'user',
                      content: toolResults,
                    },
                  ]
                  // Continue the loop to get the next response
                } else {
                  continueLoop = false
                }
              }
            }

            // If no tool use, exit the loop
            if (!hasToolUse) {
              continueLoop = false
            }
          }

          // Send done event
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'done' })}\n\n`
          ))
          controller.close()
        } catch (error) {
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`
          ))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
