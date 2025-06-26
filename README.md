# ASR Data Warehouse

## Overview
This data warehouse provides comprehensive analytics for FCCN ASR services, built using Dataform and BigQuery. It processes authentication logs and configuration data from multiple federation services to enable cross-service analysis, performance monitoring, and operational insights.

## Supported Services

| Service ID | Service Name | Description | Data Types |
|------------|--------------|-------------|------------|
| 1 | **Eduroam** | WiFi federation for educational institutions | Logs (ES) + Institutions (Webhook) |
| 2 | **RCTSAAI** | Research network AAI infrastructure | Logs (InfluxDB) + IDPs/SPs (Webhook) |
| 3 | **CIÊNCIA-ID** | National identity federation for R&E | Logs (API) + IDPs/SPs (Webhook) |

## Data Architecture

### Data Flow
```
Raw Sources → Source Views → Dimensions → Fact Tables → Analytics
```

### Schema Organization
```
dataform/
├── sources/           # Source views (fetched-*)
├── dimensions/        # Dimension tables (dim_*)
├── intermediate/      # Processing layer
├── facts/            # Fact tables
└── views/            # Analytical views
```

## Source Views (`sources/`)

Source views materialize and clean raw data from external systems:

### **Log Sources**
| View | Source System | Description |
|------|---------------|-------------|
| `fetched-es-logs` | Elasticsearch | Eduroam authentication events |
| `fetched-influx-logs` | InfluxDB | RCTSAAI daily aggregated stats |
| `fetched-ciencia-id-logs` | API | CIÊNCIA-ID daily aggregated stats |

### **Configuration Sources (Webhook Data)**
| View | Description | Service | Entity Type |
|------|-------------|---------|-------------|
| `fetched-webhook-eduroam` | Eduroam institutions | Eduroam | Institutions |
| `fetched-webhook-rctsaai-idp` | RCTSAAI identity providers | RCTSAAI | IDPs |
| `fetched-webhook-rctsaai-sp` | RCTSAAI service providers | RCTSAAI | SPs |
| `fetched-webhook-cid-idp` | CIÊNCIA-ID identity providers | CIÊNCIA-ID | IDPs |
| `fetched-webhook-cid-sp` | CIÊNCIA-ID service providers | CIÊNCIA-ID | SPs |

## Dimension Tables (`dimensions/`)

Star schema dimensions providing business context:

### **dim_institution**
**Purpose**: Master list of educational institutions across all services
```sql
institution_id: INT64          -- Surrogate key
institution_key: STRING        -- Natural key with service
codename: STRING              -- Institution identifier
description: STRING           -- Institution name
realm: STRING                 -- Authentication realm
member: BOOLEAN               -- Membership status
organization: STRING          -- Parent organization
date_activated: DATE          -- Activation date
date_cancelled: DATE          -- Cancellation date (if any)
active: BOOLEAN               -- Current status
service_id: INT64             -- Service reference (1=Eduroam, 2=RCTSAAI, 3=CIÊNCIA-ID)
service_name: STRING          -- Service name
```

### **dim_identityprovider**
**Purpose**: Identity providers from RCTSAAI and CIÊNCIA-ID services
```sql
idp_id: INT64                 -- Surrogate key
idp: STRING                   -- IDP entity ID (natural key)
service_id: INT64             -- Service reference (2=RCTSAAI, 3=CIÊNCIA-ID)
idp_codename: STRING          -- IDP code name
idp_description: STRING       -- IDP description
idp_software: STRING          -- Software platform (e.g., Shibboleth)
idp_domain: STRING            -- Domain/realm
edugain_enabled: BOOLEAN      -- eduGAIN federation status
active: BOOLEAN               -- Current status
date_activated: DATE          -- Activation date
institution_codename: STRING  -- Parent institution
service_name: STRING          -- Service name
```

**Key Features**:
- Same IDP entity can exist in multiple services (service_id differentiation)
- Links to institutions via institution_codename
- Technical metadata for operational analysis

### **dim_serviceprovider**
**Purpose**: Service providers from RCTSAAI and CIÊNCIA-ID services
```sql
sp_id: INT64                  -- Surrogate key
sp: STRING                    -- SP entity ID (natural key)
service_id: INT64             -- Service reference (2=RCTSAAI, 3=CIÊNCIA-ID)
sp_codename: STRING           -- SP code name
sp_users: STRING              -- Target user base
sp_integration_type: STRING   -- Integration type (SAML, etc.)
edugain_enabled: BOOLEAN      -- eduGAIN federation status
sp_via_proxy: STRING          -- Proxy configuration
quality_profile: STRING       -- Quality classification
esi_enabled: STRING           -- ESI status
sp_research_scholarship: STRING -- Research & Scholarship category
active: BOOLEAN               -- Current status
date_activated: DATE          -- Activation date
institution_codename: STRING  -- Parent institution
service_name: STRING          -- Service name
```

### **dim_nas**
**Purpose**: Network Access Servers from Eduroam logs
```sql
nas_id: INT64                 -- Surrogate key
nas: STRING                   -- NAS IP address (natural key)
country: STRING               -- Geographic country
region: STRING                -- Geographic region
```

**Data Source**: Extracted and deduplicated from Elasticsearch logs

### **dim_radius**
**Purpose**: RADIUS servers from Eduroam logs
```sql
radius_id: INT64              -- Surrogate key
radius: STRING                -- RADIUS server IP (natural key)
country: STRING               -- Geographic country
region: STRING                -- Geographic region
```

**Data Source**: Extracted and deduplicated from Elasticsearch logs

### **dim_date**
**Purpose**: Date dimension for time-based analysis
```sql
full_date: DATE               -- Date value
day: INT64                    -- Day of month
month: INT64                  -- Month
year: INT64                   -- Year
quarter: INT64                -- Quarter
week: INT64                   -- Week of year
weekday: INT64                -- Day of week
```

**Data Sources**: Consolidated from all log sources (ES, InfluxDB, CIÊNCIA-ID API)

### **dim_service**
**Purpose**: Static service definitions
```sql
service_id: INT64             -- Service identifier
name: STRING                  -- Service name
asr_service: STRING           -- Internal service code
```

### **dim_metric**
**Purpose**: Predefined metrics for analysis
```sql
metric_id: INT64              -- Metric identifier
name: STRING                  -- Metric name
units: STRING                 -- Measurement units
```

**Current Metrics**:
- Metric 1: "total hits" (total authentication attempts)
- Metric 4: "distinct hits" (unique authentication attempts)

## Intermediate Tables (`intermediate/`)

### **fact_es_distinct_user_hit**
**Purpose**: Individual Eduroam authentication events with dimension keys
```sql
full_date: DATE               -- Event date
institution_id: INT64         -- Institution reference (-1 if not found)
radius_id: INT64              -- RADIUS server reference (-1 if not found)
nas_id: INT64                 -- NAS reference (-1 if not found)
user_hash: STRING             -- Anonymized user identifier
auth_status: STRING           -- Authentication result
```

## Fact Tables (`facts/`)

### **fact_data_metric**
**Purpose**: Unified metrics across all federation services
```sql
full_date: DATE               -- Metric date
service_id: INT64             -- Service reference
institution_id: INT64         -- Institution reference (-1 if not found)
radius_id: INT64              -- RADIUS reference (-1 if not found, Eduroam only)
nas_id: INT64                 -- NAS reference (-1 if not found, Eduroam only)
idp_id: INT64                 -- IDP reference (-1 if not found, RCTSAAI/CIÊNCIA-ID only)
sp_id: INT64                  -- SP reference (-1 if not found, RCTSAAI/CIÊNCIA-ID only)
metric_id: INT64              -- Metric type (1=total hits, 4=distinct hits)
metric_value: FLOAT64         -- Metric value
```

**Data Processing Logic**:

1. **Eduroam (Service ID 1)**:
   - Source: Individual events via `fact_es_distinct_user_hit`
   - Aggregation: COUNT(*) for total hits, COUNT(DISTINCT user_hash) for distinct hits
   - Dimensions: institution, radius, nas (idp_id=-1, sp_id=-1)

2. **RCTSAAI (Service ID 2)**:
   - Source: Pre-aggregated data from `fetched-influx-logs`
   - Aggregation: Uses existing count_user_id and count_distinct_user_id
   - Dimensions: institution, idp, sp (radius_id=-1, nas_id=-1)

3. **CIÊNCIA-ID (Service ID 3)**:
   - Source: Pre-aggregated data from `fetched-ciencia-id-logs`
   - Aggregation: Uses existing count_user_id and count_distinct_user_id
   - Dimensions: institution, idp, sp (radius_id=-1, nas_id=-1)

**Key Features**:
- Incremental processing (only new dates)
- Partitioned by `full_date`, clustered by `service_id`, `metric_id`
- Excludes rows where `institution_id = -1` (unmapped institutions)

## Analytical Views (`views/`)

### **selected-metrics**
**Purpose**: Filters metrics to only those currently implemented
```sql
SELECT metric_id, name, units
FROM dim_metric
WHERE name IN ('distinct hits', 'total hits')
```

## Data Quality & Performance

### **Deduplication Strategy**
- **Dimensions**: Use `GROUP BY` on natural keys to prevent duplicates
- **NAS/RADIUS**: Two-step deduplication (DISTINCT + GROUP BY) for performance
- **Institutions**: Service-specific filtering prevents cross-service matches

### **Join Optimization**
- **Service isolation**: Joins filtered by `service_id` to prevent cartesian products
- **Pre-filtering**: CTE-based filtering before expensive JOINs
- **Surrogate keys**: Efficient integer joins in fact tables

### **Partitioning & Clustering**
- **Fact tables**: Partitioned by date for time-range queries
- **Dimensions**: Clustered by `service_id` for service-specific analysis
- **Intermediate tables**: Clustered by high-cardinality dimensions

### **Monitoring Points**
1. **Source views**: Row counts and freshness
2. **Dimensions**: Duplicate detection and service coverage  
3. **Fact table**: Metric completeness and cross-service consistency
4. **Performance**: Query execution times and BigQuery slot usage

This data warehouse provides a robust foundation for federated identity analytics while maintaining flexibility for future service additions and evolving analytical requirements.
