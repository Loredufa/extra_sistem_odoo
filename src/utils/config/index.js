require('dotenv').config();

module.exports = {
    host : process.env.HOST,
    PORT : process.env.PORT,
    secretKey : process.env.SECRET_KEY,
    openai_api_key : process.env.OPENAI_API_KEY,
    openai_org: process.env.OPENAI_ORG,
    assistant_id : process.env.ASSISTANT_ID,
    odoo_api_key : process.env.ODOO_API_KEY,
    odoo_db : process.env.ODOO_DB,
    odoo_url : process.env.ODOO_URL,
}

