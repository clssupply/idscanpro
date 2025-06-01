
import React from 'react';

const About: React.FC = () => {
  // --color-cyan-bright: #0891b2
  // --color-cyan: #06b6d4
  // --spacing-lg: 1.5rem (mb-6, p-6)

  return (
    <div className="p-4 sm:p-6 text-slate-200 max-w-3xl mx-auto">
      <h1 className="text-3xl font-semibold mb-8 text-center text-sky-400">About ID Scan Pro</h1>
      
      <div className="space-y-8 bg-[#1e293b] p-6 rounded-lg shadow-xl border border-slate-700">
        <section>
          <h2 className="text-2xl font-medium text-[#0891b2] mb-3">What is ID Scan Pro?</h2>
          <p className="leading-relaxed text-slate-300">
            ID Scan Pro is a demonstration application designed to scan the PDF417 barcode found on the reverse side of driver’s licenses and identification cards, typically issued by U.S. states and Canadian provinces. 
            It utilizes your device’s camera (or allows static image uploads) to read the barcode. The encoded
            data—such as Name, Date of Birth, Address, License Number, etc.—is then parsed and presented in a human-readable format.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-medium text-[#0891b2] mb-3">Technology Used</h2>
          <ul className="list-disc list-inside leading-relaxed text-slate-300 space-y-1">
            <li>React with TypeScript for the frontend framework.</li>
            <li>Tailwind CSS for styling and responsive design.</li>
            <li>ZXing Library (`@zxing/library`) for barcode decoding.</li>
            <li>Browser's `getUserMedia` API for camera access.</li>
            <li>Local Storage for persisting scan history on your device.</li>
          </ul>
        </section>

        <section>
          <h3 className="text-2xl font-medium text-red-500 mb-3">Important Disclaimer</h3>
          <p className="leading-relaxed text-slate-300">
            All scanned data is processed and stored <strong>locally</strong> in your browser’s localStorage. 
            No personal data is transmitted to any external server. The developer(s) of this application assume no responsibility 
            for the handling, protection, or distribution of personal data scanned using this tool. 
            This application is provided for demonstration and educational purposes only and comes "as is," without 
            warranties of any kind, express or implied. Use at your own risk. Ensure compliance with all applicable privacy laws and regulations when handling personal data.
          </p>
        </section>
      </div>
    </div>
  );
};

export default About;
