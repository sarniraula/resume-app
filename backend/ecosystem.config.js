module.exports = {
    apps: [{
        name: 'resume-checker-backend',
        script: './server.js',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: 'production',
            PORT: 5001,
            OLLAMA_URL: 'http://localhost:11434/api/generate',
            OLLAMA_MODEL: 'llama3'
        },
        error_file: './logs/err.log',
        out_file: './logs/out.log',
        log_file: './logs/combined.log',
        time: true
    }]
};
