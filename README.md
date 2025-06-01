# ID Scan Pro

A modern React application for scanning PDF417 barcodes on driver's licenses and ID cards with secure storage capabilities.

## Features

- **PDF417 Barcode Scanning**: Advanced barcode recognition using @zxing/library
- **Smart Storage**: Secure local storage with advanced search capabilities
- **Export Data**: Export scanned data in various formats
- **Modern UI**: Sleek interface with glassmorphism design and smooth animations
- **Mobile Responsive**: Optimized for both desktop and mobile devices
- **Offline Capable**: Works without internet connection

## Tech Stack

- **Frontend**: React 19.1.0 with TypeScript
- **Build Tool**: Vite
- **Styling**: CSS with modern design principles
- **Barcode Scanner**: @zxing/library for PDF417 decoding
- **Icons**: Font Awesome

## Run Locally

**Prerequisites:** Node.js 18+ and npm

1. Clone the repository:
   ```bash
   git clone https://github.com/clssupply/idscanpro.git
   cd idscanpro
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:5173`

## Deployment

### AWS Amplify

This app is configured for easy deployment on AWS Amplify:

1. **Connect Repository**: Link your GitHub repository to AWS Amplify
2. **Auto Build**: The `amplify.yml` file is pre-configured for automatic builds
3. **Domain Setup**: Configure your custom domain in Amplify console

The build configuration automatically:
- Installs dependencies with `npm ci`
- Builds the app with `npm run build`
- Deploys from the `dist` directory
- Caches `node_modules` for faster builds

### Manual Build

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

1. **Scan**: Point your camera at the PDF417 barcode on the back of a driver's license
2. **Review**: Verify the extracted data
3. **Store**: Save to secure local storage
4. **Search**: Use advanced search to find stored records
5. **Export**: Download data in your preferred format

## License

MIT License - see LICENSE file for details
