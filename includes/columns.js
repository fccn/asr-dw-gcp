const date_columns = {
    full_date: 'The complete date, including year, month, and day.',
    day: 'The day of the month, ranging from 1 to 31.',
    month: 'The month of the year, represented as a number (1-12).',
    year: 'The full year in four-digit format (e.g., 2024).',
    quarter: 'The quarter of the year, ranging from 1 to 4.',
    week: 'The week of the year, ranging from 1 to 52.',
    weekday: 'The day of the week, represented as a name in Portuguese (e.g., segunda-feira).'
};

const radius_columns = {
    radius_id: 'A unique identifier for the RADIUS server or instance.',
    radius: 'The name or identifier of the RADIUS server.',
    country: 'The country where the RADIUS server is located.',
    region: 'The geographical region where the RADIUS is located.'
};


const nas_columns = {
    nas_id: 'A unique identifier for the Network Access Server (NAS).',
    nas: 'The name or identifier of the Network Access Server (NAS).',
    country: 'The country where the NAS is located.',
    region: 'The geographical region where the NAS is located.'
};


const institution_columns = {
    institution_id: 'A unique identifier for the institution, based on its domain.',
    name: 'The shortened or commonly used name of the institution.',
    description: 'Institution name description.',
    realm: 'The authentication realm associated with the institution (e.g., example.edu).',
    domain: 'The fully qualified domain name of the institution, including subdomains (e.g., portal.example.edu).',
    fqdn: 'The fully qualified domain name of the institution.',
    country: 'The country where the institution is located.',
    region: 'The geographical region where the institution is located.'
};

const distinct_user_hit_columns = {
    full_date: date_columns.full_date,
    institution_id: institution_columns.institution_id,
    radius_id: radius_columns.radius_id,
    nas_id: nas_columns.nas_id,
    user_hash: 'Hash of a user.',
    auth_status: 'Authentication Status (OK or FAIL)'
}

const data_metric_columns = {
    full_date: date_columns.full_date,
    service_id: 'A unique identifier for the service provided by the company.',
    institution_id: institution_columns.institution_id,
    radius_id: radius_columns.radius_id,
    nas_id: nas_columns.nas_id,
    metric_id: 'A unique identifier for the metric.',
    metric_value: 'The mesured value of the metric.'
}

const eduroam_filtered_columns = {
    full_date: date_columns.full_date,
    auth_status: distinct_user_hit_columns.auth_status,
    domain: institution_columns.domain,
    radius: radius_columns.radius,
    nas: nas_columns.nas,
    radius_country: radius_columns.country,
    radius_region: radius_columns.region,
    nas_country: nas_columns.country,
    nas_region: nas_columns.region,
  }

module.exports = {
    date_columns,
    radius_columns,
    nas_columns,
    institution_columns,
    distinct_user_hit_columns,
    data_metric_columns,
    eduroam_filtered_columns
};
