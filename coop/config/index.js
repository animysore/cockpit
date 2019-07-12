const expect = require('chai').expect;
require('dotenv').config();

expect(process.env).to.have.property('PORT');
expect(process.env).to.have.property('JWTSECRET');
expect(process.env).to.have.property('ENVIRONMENT');

let config = {
    port: process.env.PORT,
    secret: process.env.JWTSECRET,
    environment: process.env.ENVIRONMENT
}

if (process.env.ENVIRONMENT === 'dev') {
    expect(process.env).to.have.property('USERNAME');
    config.username = process.env.USERNAME;
    
    expect(process.env).to.have.property('PASSWORD');
    config.password = process.env.PASSWORD;
}

module.exports = config;