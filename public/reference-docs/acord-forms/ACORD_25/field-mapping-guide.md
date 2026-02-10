# ACORD 25 Field Mapping Guide

## Mapping Policy Data to Form Fields

This guide explains how to map data from insurance policy documents to ACORD 25 form fields.

## General Liability Section

| Policy Data Field | Form Field ID | Notes |
|-------------------|---------------|-------|
| Policy number | gl_policy_number | Use exact policy number from dec page |
| Policy effective date | gl_effective_date | Format: MM/DD/YYYY |
| Policy expiration date | gl_expiration_date | Format: MM/DD/YYYY |
| Each Occurrence limit | gl_each_occurrence | Usually $1,000,000 or $2,000,000 |
| General Aggregate | gl_general_aggregate | Usually 2x occurrence limit |
| Products-Completed Ops | gl_products_comp_op | May equal general aggregate |
| Personal & Adv Injury | gl_personal_adv_injury | Usually equals each occurrence |
| Damage to Rented Premises | gl_damage_to_rented | Usually $100,000 - $1,000,000 |
| Med Exp (Any One Person) | gl_med_exp | Usually $5,000 - $10,000 |
| Coverage form | gl_claims_made / gl_occurrence | Check one based on policy form |

## Automobile Liability Section

| Policy Data Field | Form Field ID | Notes |
|-------------------|---------------|-------|
| Policy number | auto_policy_number | Use exact policy number |
| Effective date | auto_effective_date | Format: MM/DD/YYYY |
| Expiration date | auto_expiration_date | Format: MM/DD/YYYY |
| Combined Single Limit | auto_combined_single_limit | Usually $1,000,000 |
| Auto type | auto_any_auto, etc. | Check applicable boxes |

## Umbrella/Excess Liability Section

| Policy Data Field | Form Field ID | Notes |
|-------------------|---------------|-------|
| Policy number | umbrella_policy_number | Use exact policy number |
| Effective date | umbrella_effective_date | Format: MM/DD/YYYY |
| Expiration date | umbrella_expiration_date | Format: MM/DD/YYYY |
| Each Occurrence | umbrella_each_occurrence | Usually $1M - $10M |
| Aggregate | umbrella_aggregate | Usually equals each occurrence |
| Retention | umbrella_retention | Self-insured retention if applicable |

## Workers Compensation Section

| Policy Data Field | Form Field ID | Notes |
|-------------------|---------------|-------|
| Policy number | wc_policy_number | Use exact policy number |
| Effective date | wc_effective_date | Format: MM/DD/YYYY |
| Expiration date | wc_expiration_date | Format: MM/DD/YYYY |
| Statutory limits | wc_statutory_limits | Always check "X" |
| E.L. Each Accident | wc_el_each_accident | Usually $1,000,000 |
| E.L. Disease - Ea Employee | wc_el_disease_employee | Usually $1,000,000 |
| E.L. Disease - Policy Limit | wc_el_disease_policy | Usually $1,000,000 |

## Common Mapping Challenges

### 1. Multiple Policies for Same Coverage Type
Use Insurer A for primary coverage, Insurer B for excess. Note in Description of Operations which coverage is primary.

### 2. Blanket Additional Insured Endorsement
Note in description_of_operations:
```
[Certificate Holder Name] is included as Additional Insured per blanket endorsement CG 20 26 or equivalent.
```

### 3. Scheduled Additional Insured
Note in description_of_operations with specific endorsement:
```
[Certificate Holder Name] is included as Additional Insured per endorsement #[number] dated [date].
```

### 4. Waiver of Subrogation
Note in description_of_operations:
```
Waiver of Subrogation applies in favor of Certificate Holder per endorsement #[number].
```

### 5. Primary/Non-Contributory Coverage
Note in description_of_operations:
```
Coverage is Primary and Non-Contributory per endorsement #[number].
```

## Description of Operations Templates

### Standard Additional Insured
```
[Certificate Holder Name] is included as Additional Insured with respect to general liability and automobile liability per policy endorsements. Certificate issued for [project/contract description].
```

### Full Additional Insured with All Endorsements
```
RE: [Project Name/Contract #]

[Certificate Holder Name] is included as Additional Insured per the following endorsements:
- CGL: Endorsement #CG 20 10 + CG 20 37
- Auto: Endorsement #CA 20 48

Waiver of Subrogation applies per endorsement #CG 24 04.
Coverage is Primary and Non-Contributory per endorsement #CG 20 01.
```

### Lease Agreement
```
RE: Lease at [Property Address]

[Landlord Name] is included as Additional Insured per endorsement #[number] with respect to liability arising out of the named insured's use and occupancy of the premises located at [address].
```

## Currency Formatting

- Always use dollar amounts without cents for limits
- Use commas for thousands: $1,000,000 not $1000000
- Standard limits format: $1,000,000 / $2,000,000 / $1,000,000

## Date Formatting

- Use MM/DD/YYYY format
- Certificate dates cannot exceed policy dates
- If policy renews, issue new certificate with new dates
