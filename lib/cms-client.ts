import { CmsDocument } from '@/src/modules/cms/types';

/**
 * CMS Client Configuration
 */
interface CmsClientConfig {
    baseUrl?: string;
    apiKey?: string;
    projectId?: string;
}

export class CmsClient {
    private baseUrl: string;
    private apiKey: string;
    private projectId?: string;

    constructor(config: CmsClientConfig = {}) {
        this.baseUrl = config.baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        this.apiKey = config.apiKey || ''; // In client-side, this might be a public key or restricted
        this.projectId = config.projectId;
    }

    private async fetchAPI(endpoint: string, options: RequestInit = {}) {
        const url = `${this.baseUrl}/api/cms/${endpoint}`;

        // Merge headers
        const headers = {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            ...options.headers,
        };

        const res = await fetch(url, {
            ...options,
            headers,
        });

        if (!res.ok) {
            throw new Error(`CMS API Error: ${res.statusText}`);
        }

        return res.json();
    }

    /**
     * Fetch documents (GROQ-lite style)
     */
    async fetch<T = CmsDocument>(type: string, options?: { limit?: number; offset?: number; projectId?: string }) {
        const params = new URLSearchParams();
        params.set('type', type);
        if (options?.limit) params.set('limit', options.limit.toString());
        if (options?.offset) params.set('offset', options.offset.toString());
        if (this.projectId || options?.projectId) params.set('projectId', (options?.projectId || this.projectId)!);

        const data = await this.fetchAPI(`query?${params.toString()}`, {
            method: 'GET',
            // Next.js caching options can be passed here if extended
            next: { revalidate: 60 } // Example ISR default
        });

        return data.result as T[];
    }

    /**
     * Fetch single document by ID (not yet explicitly in API query route but easy to add filter)
     * usage: client.fetch('blog', { limit: 1 }).then(res => res[0])
     */

    /**
     * Create or update document
     */
    async createOrReplace(document: Partial<CmsDocument>) {
        if (!document._type) throw new Error('_type is required');

        return this.fetchAPI('mutate', {
            method: 'POST',
            body: JSON.stringify(document)
        });
    }

    /**
     * Upload asset
     */
    async uploadAsset(file: File) {
        const formData = new FormData();
        formData.append('file', file);

        const url = `${this.baseUrl}/api/cms/assets`;
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'x-api-key': this.apiKey
            },
            body: formData
        });

        if (!res.ok) {
            throw new Error(`CMS Asset Upload Error: ${res.statusText}`);
        }

        return res.json();
    }
}

// Singleton instance for server-side usage (optional)
export const cms = new CmsClient({
    apiKey: process.env.CMS_API_KEY // Ensure this env var is set for server-side fetching
});
