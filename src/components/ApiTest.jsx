import { useState } from 'react';
import api, { API_URL } from '@/lib/api';

export default function ApiTest() {
    const [result, setResult] = useState('');

    const test = async () => {
        try {
            // Trying to find a public health or info route
            const res = await api.get('/api/health');
            setResult('✅ Connected: ' + JSON.stringify(res));
        } catch (err) {
            setResult('❌ Failed: ' + err.message);
        }
    };

    return (
        <div className="p-6 bg-white rounded shadow-md max-w-lg mx-auto mt-10">
            <h2 className="text-2xl font-bold mb-4">Backend Connection Test</h2>
            <div className="mb-4 p-3 bg-gray-50 rounded text-sm font-mono break-all">
                <span className="font-bold">API URL:</span> {API_URL}
            </div>
            <button
                onClick={test}
                className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
            >
                Test Connection
            </button>
            {result && (
                <div className={`mt-4 p-4 rounded text-sm ${result.includes('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    <pre className="whitespace-pre-wrap">{result}</pre>
                </div>
            )}
        </div>
    );
}
