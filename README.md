# CoinChart-backend
# CoinChart-backend

## Description
CoinChart-backend is the backend service for the CoinChart Premium application. It provides APIs for authentication, subscription management, and token data retrieval.

## Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)
- MongoDB

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/CoinChart-backend.git
    cd CoinChart-backend
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Create a [.env](http://_vscodecontentref_/1) file in the root directory and add the following environment variables:
    ```env
    MONGODB_URI=your-mongodb-uri
    PORT=5000
    JWT_SECRET=your-jwt-secret-key
    BOOMFI_API_KEY=your-boomfi-api-key
    BOOMFI_API_URL=https://api.boomfi.xyz
    NODE_ENV=development
    ```

## Running the Server

1. Build the project:
    ```sh
    npm run build
    ```

2. Start the server:
    ```sh
    npm start
    ```

3. For development mode with hot-reloading:
    ```sh
    npm run dev
    ```

## Deployment

To deploy the project, you can use platforms like Vercel, Heroku, or any other cloud service that supports Node.js applications. Make sure to set the environment variables in your deployment platform.

## License
This project is licensed under the MIT License.