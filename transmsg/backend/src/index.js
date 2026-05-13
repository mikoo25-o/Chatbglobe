//
// Middleware
//
app.use(
  helmet({
    contentSecurityPolicy: false
  })
)

const allowedOrigins = [
  'http://localhost:5173',
  'https://chatbglobe-27ihw4983-mikes-projects-e87643a8.vercel.app'
]

app.use(
  cors({
    origin(origin, callback) {
      // allow requests with no origin
      if (!origin) return callback(null, true)

      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      return callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
)

// IMPORTANT
app.options('*', cors())

app.use(morgan('dev'))

app.use(
  express.json({
    limit: '10mb'
  })
)

app.use(
  express.urlencoded({
    extended: true
  })
)