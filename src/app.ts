import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/authRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
// import tokenRoutes from './routes/tokenRoutes';

// Import tasks
import { startTokenTasks } from './tasks/tokenTasks';



// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/subscription', subscriptionRoutes);
// app.use('/api/tokens', tokenRoutes);

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// MongoDB connection options
const mongoOptions: mongoose.ConnectOptions = {
  serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  // Remove deprecated options
};

// Connect to MongoDB with retry logic
const connectWithRetry = async () => {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      console.log('Attempting to connect to MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI!, mongoOptions);
      console.log('Connected to MongoDB successfully');
      
      // Start token update tasks
      startTokenTasks();
      console.log('Token update tasks started');
      
      // Start server
      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });

      break; // Exit the loop if connection is successful
    } catch (error) {
      retries++;
      console.error(`MongoDB connection attempt ${retries} failed:`, error);
      
      if (retries === maxRetries) {
        console.error('Max retries reached. Could not connect to MongoDB');
        process.exit(1);
      }
      
      // Wait for 5 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

// Start the connection process
connectWithRetry().catch(error => {
  console.error('Fatal error during startup:', error);
  process.exit(1);
});
app.use('/api/subscription', subscriptionRoutes); 

export default app;