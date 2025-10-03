export type UnsendTransporterOptions = {
    /**
     * Your Unsend API key
     */
    apiKey: string;

    /**
     * Optional custom API endpoint URL
     * @example 'https://api.unsend.dev' (default)
     * @example 'https://your-custom-endpoint.com'
     */
    apiUrl?: string;
}