const { JSDOM } = require('jsdom');

// Store session data
const sessions = new Map();

function authenticateUser(context, events, done) {
  const baseUrl = context.vars.target || 'http://localhost:3000';
  const email = process.env.SEED_EMAIL || 'member1@test.com';
  const password = process.env.SEED_PASSWORD || 'Hpci!Test2025';
  
  // Simulate login by setting basic headers
  context.vars.email = email;
  context.vars.password = password;
  
  // Add session cookies if available
  const sessionKey = `${email}`;
  if (sessions.has(sessionKey)) {
    const sessionData = sessions.get(sessionKey);
    context.vars.$_headers = {
      'Cookie': sessionData.cookie || '',
      'Content-Type': 'application/x-www-form-urlencoded'
    };
  }
  
  return done();
}

function getTodayService(context, events, done) {
  // Simulate getting today's service - use a deterministic service ID
  // In a real test, you'd extract this from the page response
  const baseServiceId = 'service_manila_' + new Date().toISOString().split('T')[0];
  context.vars.serviceId = baseServiceId;
  
  return done();
}

function getFirstEvent(context, events, done) {
  // Simulate getting the first available event ID
  // In a real test, you'd parse the events page response
  const baseEventId = 'event_christmas_service';
  context.vars.eventId = baseEventId;
  
  return done();
}

function extractServiceId(context, events, done) {
  const response = context.vars.$;
  
  try {
    // Try to extract service ID from HTML response
    if (response && response.body) {
      const dom = new JSDOM(response.body);
      const serviceForm = dom.window.document.querySelector('form[action*="checkin"]');
      
      if (serviceForm) {
        const serviceInput = serviceForm.querySelector('input[name="serviceId"]');
        if (serviceInput && serviceInput.value) {
          context.vars.serviceId = serviceInput.value;
        }
      }
    }
  } catch (error) {
    console.warn('Could not extract service ID:', error.message);
  }
  
  // Fallback to default
  if (!context.vars.serviceId) {
    context.vars.serviceId = 'service_default';
  }
  
  return done();
}

function extractEventId(context, events, done) {
  const response = context.vars.$;
  
  try {
    // Try to extract event ID from HTML response  
    if (response && response.body) {
      const dom = new JSDOM(response.body);
      const eventLinks = dom.window.document.querySelectorAll('a[href*="/events/"]');
      
      if (eventLinks.length > 0) {
        const firstEventHref = eventLinks[0].getAttribute('href');
        const eventIdMatch = firstEventHref.match(/\/events\/([^\/]+)/);
        if (eventIdMatch) {
          context.vars.eventId = eventIdMatch[1];
        }
      }
    }
  } catch (error) {
    console.warn('Could not extract event ID:', error.message);
  }
  
  // Fallback to default
  if (!context.vars.eventId) {
    context.vars.eventId = 'event_default';
  }
  
  return done();
}

function storeSession(context, events, done) {
  const email = context.vars.email;
  if (email) {
    const response = context.vars.$;
    if (response && response.headers && response.headers['set-cookie']) {
      sessions.set(email, {
        cookie: response.headers['set-cookie'].join('; '),
        timestamp: Date.now()
      });
    }
  }
  return done();
}

module.exports = {
  authenticateUser,
  getTodayService,
  getFirstEvent,
  extractServiceId,
  extractEventId,
  storeSession
};