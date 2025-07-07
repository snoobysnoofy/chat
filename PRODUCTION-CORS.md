// PRODUCTION CORS CONFIGURATION
// Replace the CORS configuration in server/index.js with this for production:

// More secure CORS configuration for production
const allowedOrigins = [
"http://localhost:3000",
"https://yourdomain.com",
/^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:3000$/,
  /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:3000$/,
/^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}:3000$/
];

const io = socketIo(server, {
cors: {
origin: (origin, callback) => {
// Allow requests with no origin (mobile apps, etc.)
if (!origin) return callback(null, true);

      // Check if origin matches allowed patterns
      const isAllowed = allowedOrigins.some(allowedOrigin => {
        if (typeof allowedOrigin === 'string') {
          return origin === allowedOrigin;
        }
        return allowedOrigin.test(origin);
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        console.log(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST"],
    credentials: true

}
});

app.use(cors({
origin: (origin, callback) => {
// Allow requests with no origin (mobile apps, etc.)
if (!origin) return callback(null, true);

    // Check if origin matches allowed patterns
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      }
      return allowedOrigin.test(origin);
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }

},
credentials: true,
methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
allowedHeaders: ["Content-Type", "Authorization"]
}));
