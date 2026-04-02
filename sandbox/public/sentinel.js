(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.SentinelWebFrontend = {}));
})(this, (function (exports) { 'use strict';

    const DEFAULT_CONFIG = {
        apiEndpoint: 'http://localhost:5000/api/collect/frontend',
        collectInterval: 5000, // 5 seconds
        enabledFeatures: {
            domEvents: true,
            performanceMonitoring: true,
            userBehavior: true,
            securityEvents: true,
            errorTracking: true,
            networkMonitoring: true
        },
        privacy: {
            maskSensitiveData: true,
            excludeSelectors: [
                'input[type="password"]',
                'input[name*="password"]',
                'input[name*="credit"]',
                'input[name*="ssn"]',
                '.sensitive-data'
            ],
            anonymizeIPs: true,
            respectDoNotTrack: true
        },
        debug: false
    };
    class ConfigManager {
        constructor(userConfig = {}) {
            this.config = this.mergeConfig(DEFAULT_CONFIG, userConfig);
        }
        mergeConfig(defaultConfig, userConfig) {
            return {
                ...defaultConfig,
                ...userConfig,
                enabledFeatures: {
                    ...defaultConfig.enabledFeatures,
                    ...userConfig.enabledFeatures
                },
                privacy: {
                    ...defaultConfig.privacy,
                    ...userConfig.privacy
                }
            };
        }
        getConfig() {
            return this.config;
        }
        updateConfig(updates) {
            this.config = this.mergeConfig(this.config, updates);
        }
        isFeatureEnabled(feature) {
            return this.config.enabledFeatures[feature];
        }
        shouldRespectPrivacy() {
            if (this.config.privacy.respectDoNotTrack &&
                navigator.doNotTrack === '1') {
                return true;
            }
            return false;
        }
    }

    class DataCollectionUtils {
        /**
         * Generate a unique session ID
         */
        static generateSessionId() {
            return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        /**
         * Get current timestamp in milliseconds
         */
        static getTimestamp() {
            return Date.now();
        }
        /**
         * Safely get element selector path
         */
        static getElementSelector(element) {
            if (!element)
                return '';
            if (element.id) {
                return `#${element.id}`;
            }
            if (element.className) {
                const classes = element.className.split(' ').filter(c => c.trim());
                if (classes.length > 0) {
                    return `.${classes.join('.')}`;
                }
            }
            return element.tagName.toLowerCase();
        }
        /**
         * Sanitize sensitive data based on privacy settings
         */
        static sanitizeData(data, excludeSelectors) {
            if (typeof data === 'string') {
                // Check for common sensitive patterns
                if (this.containsSensitiveData(data)) {
                    return '[REDACTED]';
                }
            }
            if (typeof data === 'object' && data !== null) {
                const sanitized = {};
                for (const [key, value] of Object.entries(data)) {
                    if (this.isSensitiveKey(key)) {
                        sanitized[key] = '[REDACTED]';
                    }
                    else {
                        sanitized[key] = this.sanitizeData(value, excludeSelectors);
                    }
                }
                return sanitized;
            }
            return data;
        }
        /**
         * Check if data contains sensitive information
         */
        static containsSensitiveData(data) {
            const sensitivePatterns = [
                /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card
                /\b\d{3}-\d{2}-\d{4}\b/, // SSN
                /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email (in some contexts)
                /password|pwd|secret|token/i
            ];
            return sensitivePatterns.some(pattern => pattern.test(data));
        }
        /**
         * Check if a key is considered sensitive
         */
        static isSensitiveKey(key) {
            const sensitiveKeys = [
                'password', 'pwd', 'secret', 'token', 'key', 'auth',
                'credit', 'card', 'ssn', 'social', 'security'
            ];
            const keyLower = key.toLowerCase();
            return sensitiveKeys.some(sensitive => keyLower.includes(sensitive));
        }
        /**
         * Throttle function execution
         */
        static throttle(func, limit) {
            let inThrottle;
            return function (...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        }
        /**
         * Debounce function execution
         */
        static debounce(func, wait) {
            let timeout;
            return function (...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        }
        /**
         * Check if an element should be excluded from tracking
         */
        static shouldExcludeElement(element, excludeSelectors) {
            return excludeSelectors.some(selector => {
                try {
                    return element.matches(selector);
                }
                catch (e) {
                    return false;
                }
            });
        }
        /**
         * Get viewport information
         */
        static getViewportInfo() {
            return {
                width: window.innerWidth,
                height: window.innerHeight,
                scrollX: window.scrollX,
                scrollY: window.scrollY
            };
        }
        /**
         * Get browser information
         */
        static getBrowserInfo() {
            const ua = navigator.userAgent;
            return {
                userAgent: ua,
                language: navigator.language,
                platform: navigator.platform,
                cookieEnabled: navigator.cookieEnabled,
                onLine: navigator.onLine,
                doNotTrack: navigator.doNotTrack
            };
        }
        /**
         * Check if the current page is loaded over HTTPS
         */
        static isSecureContext() {
            return window.isSecureContext || location.protocol === 'https:';
        }
        /**
         * Get performance timing information
         */
        static getPerformanceTiming() {
            if (!('performance' in window)) {
                return null;
            }
            const timing = performance.timing;
            const navigation = performance.navigation;
            return {
                loadTime: timing.loadEventEnd - timing.navigationStart,
                domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
                firstPaint: this.getFirstPaint(),
                navigationTiming: {
                    redirectTime: timing.redirectEnd - timing.redirectStart,
                    dnsTime: timing.domainLookupEnd - timing.domainLookupStart,
                    connectTime: timing.connectEnd - timing.connectStart,
                    requestTime: timing.responseEnd - timing.requestStart,
                    responseTime: timing.responseEnd - timing.responseStart,
                    domProcessingTime: timing.loadEventStart - timing.domLoading,
                    loadEventTime: timing.loadEventEnd - timing.loadEventStart
                },
                navigationType: navigation.type,
                redirectCount: navigation.redirectCount
            };
        }
        /**
         * Get First Paint timing
         */
        static getFirstPaint() {
            if ('performance' in window && 'getEntriesByType' in performance) {
                const paintEntries = performance.getEntriesByType('paint');
                const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
                return firstPaint ? firstPaint.startTime : 0;
            }
            return 0;
        }
    }

    class BehaviorTracker {
        constructor(excludeSelectors = []) {
            this.mouseClicks = 0;
            this.keystrokes = 0;
            this.scrollEvents = 0;
            this.formInteractions = 0;
            this.navigationEvents = 0;
            this.idleTime = 0;
            this.mouseMovements = [];
            this.clickPattern = [];
            this.lastActivity = Date.now();
            this.isIdle = false;
            this.idleThreshold = 30000; // 30 seconds
            this.excludeSelectors = excludeSelectors;
            this.setupEventListeners();
        }
        setupEventListeners() {
            // Mouse click tracking
            document.addEventListener('click', this.handleClick.bind(this), { passive: true });
            // Keystroke tracking
            document.addEventListener('keydown', this.handleKeydown.bind(this), { passive: true });
            // Scroll tracking
            window.addEventListener('scroll', DataCollectionUtils.throttle(this.handleScroll.bind(this), 100), { passive: true });
            // Form interaction tracking
            document.addEventListener('input', this.handleFormInteraction.bind(this), { passive: true });
            document.addEventListener('change', this.handleFormInteraction.bind(this), { passive: true });
            // Navigation tracking
            window.addEventListener('popstate', this.handleNavigation.bind(this), { passive: true });
            // Mouse movement tracking (throttled to avoid performance issues)
            document.addEventListener('mousemove', DataCollectionUtils.throttle(this.handleMouseMove.bind(this), 100), { passive: true });
            // Idle time tracking
            this.startIdleTracking();
        }
        handleClick(event) {
            const target = event.target;
            if (DataCollectionUtils.shouldExcludeElement(target, this.excludeSelectors)) {
                return;
            }
            this.mouseClicks++;
            this.resetIdleTimer();
            // Store click pattern for behavior analysis
            const clickEvent = {
                element: DataCollectionUtils.getElementSelector(target),
                x: event.clientX,
                y: event.clientY,
                timestamp: Date.now(),
                button: event.button
            };
            this.clickPattern.push(clickEvent);
            // Keep only last 50 clicks to manage memory
            if (this.clickPattern.length > 50) {
                this.clickPattern.shift();
            }
        }
        handleKeydown(event) {
            const target = event.target;
            if (DataCollectionUtils.shouldExcludeElement(target, this.excludeSelectors)) {
                return;
            }
            this.keystrokes++;
            this.resetIdleTimer();
        }
        handleScroll() {
            this.scrollEvents++;
            this.resetIdleTimer();
        }
        handleFormInteraction(event) {
            const target = event.target;
            if (DataCollectionUtils.shouldExcludeElement(target, this.excludeSelectors)) {
                return;
            }
            this.formInteractions++;
            this.resetIdleTimer();
        }
        handleNavigation() {
            this.navigationEvents++;
            this.resetIdleTimer();
        }
        handleMouseMove(event) {
            const movement = {
                x: event.clientX,
                y: event.clientY,
                timestamp: Date.now()
            };
            this.mouseMovements.push(movement);
            this.resetIdleTimer();
            // Keep only last 100 movements to manage memory
            if (this.mouseMovements.length > 100) {
                this.mouseMovements.shift();
            }
        }
        startIdleTracking() {
            setInterval(() => {
                const now = Date.now();
                const timeSinceLastActivity = now - this.lastActivity;
                if (timeSinceLastActivity > this.idleThreshold && !this.isIdle) {
                    this.isIdle = true;
                }
                else if (timeSinceLastActivity <= this.idleThreshold && this.isIdle) {
                    this.isIdle = false;
                }
                if (this.isIdle) {
                    this.idleTime += 1000; // Add 1 second
                }
            }, 1000);
        }
        resetIdleTimer() {
            this.lastActivity = Date.now();
            this.isIdle = false;
        }
        getMetrics() {
            return {
                mouseClicks: this.mouseClicks,
                keystrokes: this.keystrokes,
                scrollEvents: this.scrollEvents,
                formInteractions: this.formInteractions,
                navigationEvents: this.navigationEvents,
                idleTime: this.idleTime,
                mouseMovements: [...this.mouseMovements], // Create a copy
                clickPattern: [...this.clickPattern] // Create a copy
            };
        }
        reset() {
            this.mouseClicks = 0;
            this.keystrokes = 0;
            this.scrollEvents = 0;
            this.formInteractions = 0;
            this.navigationEvents = 0;
            this.idleTime = 0;
            this.mouseMovements = [];
            this.clickPattern = [];
            this.lastActivity = Date.now();
            this.isIdle = false;
        }
        destroy() {
            // Clean up event listeners if needed
            // Note: Modern browsers handle this automatically when page unloads
        }
    }

    // Type definitions for SentinelWeb Frontend Agent
    exports.SecurityEventType = void 0;
    (function (SecurityEventType) {
        SecurityEventType["SUSPICIOUS_INPUT"] = "suspicious_input";
        SecurityEventType["XSS_ATTEMPT"] = "xss_attempt";
        SecurityEventType["SQL_INJECTION_ATTEMPT"] = "sql_injection_attempt";
        SecurityEventType["CSRF_MISSING"] = "csrf_missing";
        SecurityEventType["UNUSUAL_NAVIGATION"] = "unusual_navigation";
        SecurityEventType["MULTIPLE_FAILED_ATTEMPTS"] = "multiple_failed_attempts";
        SecurityEventType["SUSPICIOUS_HEADERS"] = "suspicious_headers";
        SecurityEventType["CONTENT_SECURITY_POLICY_VIOLATION"] = "csp_violation";
    })(exports.SecurityEventType || (exports.SecurityEventType = {}));

    class SecurityMonitor {
        constructor(excludeSelectors = []) {
            this.securityEvents = [];
            this.suspiciousPatterns = new Map();
            // Security patterns to detect
            this.xssPatterns = [
                /<script[^>]*>.*?<\/script>/gi,
                /javascript:/gi,
                /on\w+\s*=\s*[\"'][^\"']*[\"']/gi,
                /<iframe[^>]*>.*?<\/iframe>/gi
            ];
            this.sqlInjectionPatterns = [
                /('|(\\')|(;)|(\\;))|(union)|(select)|(insert)|(delete)|(update)|(drop)|(create)|(alter)|(exec)|(execute)/gi,
                /(\\x27)|(\\x22)|(\\u0027)|(\\u0022)/gi,
                /(\%27)|(\%22)|(\%3b)|(\%3d)/gi
            ];
            this.suspiciousInputPatterns = [
                /\.\.\//g, // Directory traversal
                /eval\s*\(/gi,
                /document\.cookie/gi,
                /window\.location/gi
            ];
            this.excludeSelectors = excludeSelectors;
            this.setupSecurityMonitoring();
        }
        setupSecurityMonitoring() {
            // Monitor form inputs for suspicious content
            document.addEventListener('input', this.monitorInput.bind(this), { passive: true });
            // Monitor form submissions
            document.addEventListener('submit', this.monitorFormSubmission.bind(this), { passive: true });
            // Monitor for CSP violations
            document.addEventListener('securitypolicyviolation', this.handleCSPViolation.bind(this));
            // Monitor failed login attempts (look for common patterns)
            this.monitorFailedAuthentication();
            // Check for CSRF protection
            this.checkCSRFProtection();
            // Monitor unusual navigation patterns
            this.monitorNavigationPatterns();
        }
        monitorInput(event) {
            const target = event.target;
            if (!target || DataCollectionUtils.shouldExcludeElement(target, this.excludeSelectors)) {
                return;
            }
            const value = target.value;
            if (!value)
                return;
            // Check for XSS attempts
            if (this.detectXSS(value)) {
                this.addSecurityEvent({
                    type: exports.SecurityEventType.XSS_ATTEMPT,
                    severity: 'high',
                    description: 'Potential XSS payload detected in input field',
                    timestamp: Date.now(),
                    metadata: {
                        elementSelector: DataCollectionUtils.getElementSelector(target),
                        inputType: target.type,
                        inputName: target.name
                    }
                });
            }
            // Check for SQL injection attempts
            if (this.detectSQLInjection(value)) {
                this.addSecurityEvent({
                    type: exports.SecurityEventType.SQL_INJECTION_ATTEMPT,
                    severity: 'high',
                    description: 'Potential SQL injection attempt detected',
                    timestamp: Date.now(),
                    metadata: {
                        elementSelector: DataCollectionUtils.getElementSelector(target),
                        inputType: target.type,
                        inputName: target.name
                    }
                });
            }
            // Check for other suspicious patterns
            if (this.detectSuspiciousInput(value)) {
                this.addSecurityEvent({
                    type: exports.SecurityEventType.SUSPICIOUS_INPUT,
                    severity: 'medium',
                    description: 'Suspicious input pattern detected',
                    timestamp: Date.now(),
                    metadata: {
                        elementSelector: DataCollectionUtils.getElementSelector(target),
                        inputType: target.type,
                        inputName: target.name
                    }
                });
            }
        }
        monitorFormSubmission(event) {
            const form = event.target;
            if (!form || DataCollectionUtils.shouldExcludeElement(form, this.excludeSelectors)) {
                return;
            }
            // Check for CSRF token presence in forms
            const hasCSRFToken = this.hasCSRFToken(form);
            if (!hasCSRFToken && this.isStateChangingForm(form)) {
                this.addSecurityEvent({
                    type: exports.SecurityEventType.CSRF_MISSING,
                    severity: 'medium',
                    description: 'Form submission without CSRF protection',
                    timestamp: Date.now(),
                    metadata: {
                        formAction: form.action,
                        formMethod: form.method,
                        formSelector: DataCollectionUtils.getElementSelector(form)
                    }
                });
            }
        }
        handleCSPViolation(event) {
            this.addSecurityEvent({
                type: exports.SecurityEventType.CONTENT_SECURITY_POLICY_VIOLATION,
                severity: 'high',
                description: 'Content Security Policy violation',
                timestamp: Date.now(),
                metadata: {
                    violatedDirective: event.violatedDirective,
                    blockedURI: event.blockedURI,
                    documentURI: event.documentURI,
                    originalPolicy: event.originalPolicy
                }
            });
        }
        monitorFailedAuthentication() {
            // Look for common error messages or failed login indicators
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                const element = node;
                                const text = element.textContent?.toLowerCase() || '';
                                if (this.isFailedAuthMessage(text)) {
                                    this.trackFailedAuthentication();
                                }
                            }
                        });
                    }
                });
            });
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
        monitorNavigationPatterns() {
            let navigationCount = 0;
            let rapidNavigationStart = 0;
            const handleNavigation = () => {
                const now = Date.now();
                navigationCount++;
                if (navigationCount === 1) {
                    rapidNavigationStart = now;
                }
                // Check for unusually rapid navigation (more than 10 navigations in 30 seconds)
                if (navigationCount > 10 && (now - rapidNavigationStart) < 30000) {
                    this.addSecurityEvent({
                        type: exports.SecurityEventType.UNUSUAL_NAVIGATION,
                        severity: 'medium',
                        description: 'Unusual rapid navigation pattern detected',
                        timestamp: now,
                        metadata: {
                            navigationCount,
                            timespan: now - rapidNavigationStart
                        }
                    });
                    navigationCount = 0; // Reset counter
                }
                // Reset counter after 30 seconds
                setTimeout(() => {
                    if (navigationCount > 0)
                        navigationCount--;
                }, 30000);
            };
            window.addEventListener('popstate', handleNavigation);
            // Also monitor programmatic navigation
            const originalPushState = history.pushState;
            const originalReplaceState = history.replaceState;
            history.pushState = function (...args) {
                handleNavigation();
                return originalPushState.apply(this, args);
            };
            history.replaceState = function (...args) {
                handleNavigation();
                return originalReplaceState.apply(this, args);
            };
        }
        detectXSS(input) {
            return this.xssPatterns.some(pattern => pattern.test(input));
        }
        detectSQLInjection(input) {
            return this.sqlInjectionPatterns.some(pattern => pattern.test(input));
        }
        detectSuspiciousInput(input) {
            return this.suspiciousInputPatterns.some(pattern => pattern.test(input));
        }
        hasCSRFToken(form) {
            const csrfSelectors = [
                'input[name*="csrf"]',
                'input[name*="token"]',
                'input[name="_token"]',
                'input[name="authenticity_token"]'
            ];
            return csrfSelectors.some(selector => form.querySelector(selector) !== null);
        }
        isStateChangingForm(form) {
            const method = form.method.toLowerCase();
            return method === 'post' || method === 'put' || method === 'patch' || method === 'delete';
        }
        isFailedAuthMessage(text) {
            const failedAuthPatterns = [
                'invalid credentials',
                'login failed',
                'authentication failed',
                'incorrect password',
                'user not found',
                'access denied'
            ];
            return failedAuthPatterns.some(pattern => text.includes(pattern));
        }
        trackFailedAuthentication() {
            const key = 'failed_auth';
            const count = this.suspiciousPatterns.get(key) || 0;
            this.suspiciousPatterns.set(key, count + 1);
            if (count >= 3) { // Multiple failed attempts
                this.addSecurityEvent({
                    type: exports.SecurityEventType.MULTIPLE_FAILED_ATTEMPTS,
                    severity: 'high',
                    description: 'Multiple failed authentication attempts detected',
                    timestamp: Date.now(),
                    metadata: {
                        attemptCount: count + 1,
                        url: window.location.href
                    }
                });
            }
        }
        checkCSRFProtection() {
            // Check if the page has CSRF meta tags or tokens
            const hasCSRFMeta = document.querySelector('meta[name="csrf-token"]') !== null;
            const hasCSRFInput = document.querySelector('input[name*="csrf"]') !== null;
            if (!hasCSRFMeta && !hasCSRFInput) {
                this.addSecurityEvent({
                    type: exports.SecurityEventType.CSRF_MISSING,
                    severity: 'low',
                    description: 'Page lacks CSRF protection mechanisms',
                    timestamp: Date.now(),
                    metadata: {
                        url: window.location.href,
                        hasCSRFMeta,
                        hasCSRFInput
                    }
                });
            }
        }
        addSecurityEvent(event) {
            this.securityEvents.push(event);
            // Keep only last 100 events to manage memory
            if (this.securityEvents.length > 100) {
                this.securityEvents.shift();
            }
        }
        getSecurityEvents() {
            return [...this.securityEvents]; // Return a copy
        }
        reset() {
            this.securityEvents = [];
            this.suspiciousPatterns.clear();
        }
        destroy() {
            // Clean up observers and event listeners if needed
        }
    }

    class PerformanceMonitor {
        constructor() {
            this.memoryUsage = 0;
            this.cpuUtilization = 0;
            this.networkLatency = 0;
            this.renderTime = 0;
            this.jsExecutionTime = 0;
            this.setupPerformanceMonitoring();
        }
        setupPerformanceMonitoring() {
            // Monitor performance metrics periodically
            this.startPerformanceCollection();
            // Monitor long tasks (tasks that block main thread for > 50ms)
            this.monitorLongTasks();
            // Monitor resource loading
            this.monitorResourceLoading();
        }
        startPerformanceCollection() {
            setInterval(() => {
                this.collectMemoryUsage();
                this.collectNetworkLatency();
                this.collectRenderMetrics();
            }, 5000); // Collect every 5 seconds
        }
        collectMemoryUsage() {
            if ('memory' in performance) {
                const memory = performance.memory;
                this.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
            }
        }
        collectNetworkLatency() {
            if ('connection' in navigator) {
                const connection = navigator.connection;
                this.networkLatency = connection.rtt || 0;
            }
        }
        collectRenderMetrics() {
            if ('now' in performance) {
                const start = performance.now();
                requestAnimationFrame(() => {
                    this.renderTime = performance.now() - start;
                });
            }
        }
        monitorLongTasks() {
            if ('PerformanceObserver' in window) {
                try {
                    const observer = new PerformanceObserver((list) => {
                        const entries = list.getEntries();
                        entries.forEach((entry) => {
                            if (entry.duration > 50) { // Long task threshold
                                this.jsExecutionTime += entry.duration;
                            }
                        });
                    });
                    observer.observe({ entryTypes: ['longtask'] });
                }
                catch (e) {
                    // PerformanceObserver might not support longtask
                    console.warn('Long task monitoring not supported:', e);
                }
            }
        }
        monitorResourceLoading() {
            if ('PerformanceObserver' in window) {
                try {
                    const observer = new PerformanceObserver((list) => {
                        const entries = list.getEntries();
                        entries.forEach((entry) => {
                            if (entry.entryType === 'resource') {
                                // Track slow resources
                                if (entry.duration > 1000) { // Resources taking > 1 second
                                    console.warn('Slow resource detected:', entry.name, entry.duration);
                                }
                            }
                        });
                    });
                    observer.observe({ entryTypes: ['resource'] });
                }
                catch (e) {
                    console.warn('Resource monitoring not supported:', e);
                }
            }
        }
        getPerformanceMetrics() {
            return {
                memoryUsage: this.memoryUsage,
                cpuUtilization: this.cpuUtilization,
                networkLatency: this.networkLatency,
                renderTime: this.renderTime,
                jsExecutionTime: this.jsExecutionTime
            };
        }
        getPageMetrics() {
            const timing = performance.timing;
            const paintEntries = performance.getEntriesByType('paint');
            let firstPaint = 0;
            let firstContentfulPaint = 0;
            let largestContentfulPaint = 0;
            let cumulativeLayoutShift = 0;
            let firstInputDelay = 0;
            // Get paint metrics
            paintEntries.forEach((entry) => {
                if (entry.name === 'first-paint') {
                    firstPaint = entry.startTime;
                }
                else if (entry.name === 'first-contentful-paint') {
                    firstContentfulPaint = entry.startTime;
                }
            });
            // Get LCP if available
            if ('PerformanceObserver' in window) {
                try {
                    const observer = new PerformanceObserver((list) => {
                        const entries = list.getEntries();
                        const lastEntry = entries[entries.length - 1];
                        if (lastEntry) {
                            largestContentfulPaint = lastEntry.startTime;
                        }
                    });
                    observer.observe({ entryTypes: ['largest-contentful-paint'] });
                }
                catch (e) {
                    // LCP not supported
                }
            }
            // Get CLS if available
            if ('PerformanceObserver' in window) {
                try {
                    let clsValue = 0;
                    const observer = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            if (!entry.hadRecentInput) {
                                clsValue += entry.value;
                            }
                        }
                        cumulativeLayoutShift = clsValue;
                    });
                    observer.observe({ entryTypes: ['layout-shift'] });
                }
                catch (e) {
                    // CLS not supported
                }
            }
            return {
                loadTime: timing.loadEventEnd - timing.navigationStart,
                domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
                firstPaint,
                firstContentfulPaint,
                largestContentfulPaint,
                cumulativeLayoutShift,
                firstInputDelay
            };
        }
        reset() {
            this.memoryUsage = 0;
            this.cpuUtilization = 0;
            this.networkLatency = 0;
            this.renderTime = 0;
            this.jsExecutionTime = 0;
        }
        destroy() {
            // Clean up performance observers if needed
        }
    }

    class ErrorTracker {
        constructor() {
            this.errorEvents = [];
            this.networkEvents = [];
            this.originalFetch = window.fetch;
            this.originalXHROpen = XMLHttpRequest.prototype.open;
            this.setupErrorTracking();
        }
        setupErrorTracking() {
            // JavaScript errors
            window.addEventListener('error', this.handleJavaScriptError.bind(this));
            // Unhandled promise rejections
            window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
            // Resource loading errors
            window.addEventListener('error', this.handleResourceError.bind(this), true);
            // Network monitoring
            this.interceptFetch();
            this.interceptXHR();
        }
        handleJavaScriptError(event) {
            const errorEvent = {
                type: 'javascript',
                message: event.message,
                source: event.filename || '',
                line: event.lineno || 0,
                column: event.colno || 0,
                stack: event.error?.stack || '',
                timestamp: Date.now()
            };
            this.addErrorEvent(errorEvent);
        }
        handleUnhandledRejection(event) {
            const errorEvent = {
                type: 'javascript',
                message: `Unhandled Promise Rejection: ${event.reason}`,
                source: window.location.href,
                line: 0,
                column: 0,
                stack: event.reason?.stack || '',
                timestamp: Date.now()
            };
            this.addErrorEvent(errorEvent);
        }
        handleResourceError(event) {
            const target = event.target;
            if (target && target !== window && (target.tagName === 'IMG' || target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
                const errorEvent = {
                    type: 'resource',
                    message: `Failed to load resource: ${target.tagName}`,
                    source: target.src || target.href || '',
                    line: 0,
                    column: 0,
                    stack: '',
                    timestamp: Date.now()
                };
                this.addErrorEvent(errorEvent);
            }
        }
        interceptFetch() {
            const self = this;
            window.fetch = async function (...args) {
                const startTime = Date.now();
                const url = typeof args[0] === 'string' ? args[0] : args[0].url || args[0].toString();
                const method = args[1]?.method || 'GET';
                let requestSize = 0;
                if (args[1]?.body) {
                    requestSize = new TextEncoder().encode(String(args[1].body)).length;
                }
                try {
                    const response = await self.originalFetch.apply(this, args);
                    const endTime = Date.now();
                    // Get response size estimate
                    const responseSize = parseInt(response.headers.get('content-length') || '0');
                    const networkEvent = {
                        url,
                        method,
                        status: response.status,
                        responseTime: endTime - startTime,
                        requestSize,
                        responseSize,
                        timestamp: startTime
                    };
                    self.addNetworkEvent(networkEvent);
                    // Track network errors
                    if (!response.ok) {
                        const errorEvent = {
                            type: 'network',
                            message: `HTTP ${response.status}: ${response.statusText}`,
                            source: url,
                            line: 0,
                            column: 0,
                            stack: '',
                            timestamp: Date.now()
                        };
                        self.addErrorEvent(errorEvent);
                    }
                    return response;
                }
                catch (error) {
                    const endTime = Date.now();
                    // Track failed network request
                    const networkEvent = {
                        url,
                        method,
                        status: 0,
                        responseTime: endTime - startTime,
                        requestSize,
                        responseSize: 0,
                        timestamp: startTime
                    };
                    self.addNetworkEvent(networkEvent);
                    // Track network error
                    const errorEvent = {
                        type: 'network',
                        message: `Network error: ${error}`,
                        source: url,
                        line: 0,
                        column: 0,
                        stack: error instanceof Error ? error.stack || '' : '',
                        timestamp: Date.now()
                    };
                    self.addErrorEvent(errorEvent);
                    throw error;
                }
            };
        }
        interceptXHR() {
            const self = this;
            XMLHttpRequest.prototype.open = function (method, url, ...args) {
                const startTime = Date.now();
                const urlString = typeof url === 'string' ? url : url.toString();
                // Store request info on the XHR object
                this._sentinelStartTime = startTime;
                this._sentinelMethod = method;
                this._sentinelUrl = urlString;
                // Set up event listeners
                this.addEventListener('loadend', function () {
                    const endTime = Date.now();
                    const responseTime = endTime - startTime;
                    const networkEvent = {
                        url: urlString,
                        method: method.toUpperCase(),
                        status: this.status,
                        responseTime,
                        requestSize: 0, // Hard to calculate for XHR
                        responseSize: this.responseText ? this.responseText.length : 0,
                        timestamp: startTime
                    };
                    self.addNetworkEvent(networkEvent);
                    // Track HTTP errors
                    if (this.status >= 400) {
                        const errorEvent = {
                            type: 'network',
                            message: `HTTP ${this.status}: ${this.statusText}`,
                            source: urlString,
                            line: 0,
                            column: 0,
                            stack: '',
                            timestamp: Date.now()
                        };
                        self.addErrorEvent(errorEvent);
                    }
                });
                this.addEventListener('error', function () {
                    const errorEvent = {
                        type: 'network',
                        message: 'XMLHttpRequest error',
                        source: urlString,
                        line: 0,
                        column: 0,
                        stack: '',
                        timestamp: Date.now()
                    };
                    self.addErrorEvent(errorEvent);
                });
                return self.originalXHROpen.apply(this, [method, url, true]);
            };
        }
        addErrorEvent(errorEvent) {
            this.errorEvents.push(errorEvent);
            // Keep only last 50 errors to manage memory
            if (this.errorEvents.length > 50) {
                this.errorEvents.shift();
            }
        }
        addNetworkEvent(networkEvent) {
            this.networkEvents.push(networkEvent);
            // Keep only last 100 network events to manage memory
            if (this.networkEvents.length > 100) {
                this.networkEvents.shift();
            }
        }
        getErrorEvents() {
            return [...this.errorEvents]; // Return a copy
        }
        getNetworkEvents() {
            return [...this.networkEvents]; // Return a copy
        }
        reset() {
            this.errorEvents = [];
            this.networkEvents = [];
        }
        destroy() {
            // Restore original functions
            window.fetch = this.originalFetch;
            XMLHttpRequest.prototype.open = this.originalXHROpen;
        }
    }

    class SentinelWebFrontend {
        constructor(userConfig = {}) {
            this.isRunning = false;
            this.config = new ConfigManager(userConfig);
            this.sessionId = DataCollectionUtils.generateSessionId();
            this.startTime = Date.now();
            // Check privacy settings
            if (this.config.shouldRespectPrivacy()) {
                console.log('SentinelWeb: Respecting Do Not Track setting');
                return;
            }
            this.initializeComponents();
        }
        initializeComponents() {
            const configData = this.config.getConfig();
            const excludeSelectors = configData.privacy.excludeSelectors;
            // Initialize components based on enabled features
            if (this.config.isFeatureEnabled('userBehavior')) {
                this.behaviorTracker = new BehaviorTracker(excludeSelectors);
            }
            if (this.config.isFeatureEnabled('securityEvents')) {
                this.securityMonitor = new SecurityMonitor(excludeSelectors);
            }
            if (this.config.isFeatureEnabled('performanceMonitoring')) {
                this.performanceMonitor = new PerformanceMonitor();
            }
            if (this.config.isFeatureEnabled('errorTracking') || this.config.isFeatureEnabled('networkMonitoring')) {
                this.errorTracker = new ErrorTracker();
            }
        }
        /**
         * Start the SentinelWeb frontend agent
         */
        start() {
            if (this.isRunning) {
                console.warn('SentinelWeb: Agent is already running');
                return;
            }
            if (this.config.shouldRespectPrivacy()) {
                console.log('SentinelWeb: Not starting due to privacy settings');
                return;
            }
            this.isRunning = true;
            const configData = this.config.getConfig();
            if (configData.debug) {
                console.log('SentinelWeb: Starting frontend agent', {
                    sessionId: this.sessionId,
                    config: configData
                });
            }
            // Start periodic data collection
            this.startDataCollection();
        }
        /**
         * Stop the SentinelWeb frontend agent
         */
        stop() {
            if (!this.isRunning) {
                return;
            }
            this.isRunning = false;
            if (this.collectionInterval) {
                clearInterval(this.collectionInterval);
                this.collectionInterval = undefined;
            }
            // Clean up components
            this.behaviorTracker?.destroy();
            this.securityMonitor?.destroy();
            this.performanceMonitor?.destroy();
            this.errorTracker?.destroy();
            const configData = this.config.getConfig();
            if (configData.debug) {
                console.log('SentinelWeb: Stopped frontend agent');
            }
        }
        /**
         * Get current session ID
         */
        getSessionId() {
            return this.sessionId;
        }
        /**
         * Update configuration
         */
        updateConfig(updates) {
            this.config.updateConfig(updates);
            // Reinitialize components if needed
            if (this.isRunning) {
                this.stop();
                this.initializeComponents();
                this.start();
            }
        }
        /**
         * Manually trigger data collection
         */
        collectData() {
            if (this.config.shouldRespectPrivacy()) {
                return null;
            }
            return this.gatherMetrics();
        }
        /**
         * Start periodic data collection
         */
        startDataCollection() {
            const configData = this.config.getConfig();
            this.collectionInterval = setInterval(() => {
                if (!this.isRunning)
                    return;
                try {
                    const metrics = this.gatherMetrics();
                    this.sendMetrics(metrics);
                }
                catch (error) {
                    console.error('SentinelWeb: Error collecting data:', error);
                }
            }, configData.collectInterval);
        }
        /**
         * Gather all metrics from components
         */
        gatherMetrics() {
            const configData = this.config.getConfig();
            const now = Date.now();
            const metrics = {
                sessionId: this.sessionId,
                timestamp: now,
                url: window.location.href,
                userAgent: navigator.userAgent,
                sessionDuration: now - this.startTime,
                pageMetrics: this.performanceMonitor?.getPageMetrics() || {
                    loadTime: 0,
                    domContentLoaded: 0,
                    firstPaint: 0,
                    firstContentfulPaint: 0,
                    largestContentfulPaint: 0,
                    cumulativeLayoutShift: 0,
                    firstInputDelay: 0
                },
                userBehavior: this.behaviorTracker?.getMetrics() || {
                    mouseClicks: 0,
                    keystrokes: 0,
                    scrollEvents: 0,
                    formInteractions: 0,
                    navigationEvents: 0,
                    idleTime: 0,
                    mouseMovements: [],
                    clickPattern: []
                },
                securityEvents: this.securityMonitor?.getSecurityEvents() || [],
                performanceMetrics: this.performanceMonitor?.getPerformanceMetrics() || {
                    memoryUsage: 0,
                    cpuUtilization: 0,
                    networkLatency: 0,
                    renderTime: 0,
                    jsExecutionTime: 0
                },
                errorEvents: this.errorTracker?.getErrorEvents() || [],
                networkEvents: this.errorTracker?.getNetworkEvents() || []
            };
            // Sanitize sensitive data if privacy is enabled
            if (configData.privacy.maskSensitiveData) {
                return DataCollectionUtils.sanitizeData(metrics, configData.privacy.excludeSelectors);
            }
            return metrics;
        }
        /**
         * Send metrics to the backend
         */
        async sendMetrics(metrics) {
            const configData = this.config.getConfig();
            try {
                const headers = {
                    'Content-Type': 'application/json'
                };
                const response = await fetch(configData.apiEndpoint, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(metrics)
                });
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                if (configData.debug) {
                    console.log('SentinelWeb: Metrics sent successfully', metrics);
                }
            }
            catch (error) {
                if (configData.debug) {
                    console.error('SentinelWeb: Failed to send metrics:', error);
                }
                // Could implement retry logic here
                // or store metrics locally for later transmission
            }
        }
        /**
         * Reset all collected data
         */
        reset() {
            this.behaviorTracker?.reset();
            this.securityMonitor?.reset();
            this.performanceMonitor?.reset();
            this.errorTracker?.reset();
            this.sessionId = DataCollectionUtils.generateSessionId();
            this.startTime = Date.now();
        }
    }
    // Auto-start functionality for script tag usage
    if (typeof window !== 'undefined' && window.SentinelWebAutoStart) {
        const agent = new SentinelWebFrontend(window.SentinelWebConfig || {});
        agent.start();
        // Make agent globally available
        window.SentinelWeb = agent;
    }

    exports.ConfigManager = ConfigManager;
    exports.DataCollectionUtils = DataCollectionUtils;
    exports.SentinelWebFrontend = SentinelWebFrontend;
    exports.default = SentinelWebFrontend;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=index.umd.js.map
