const fs = require('fs');
let content = fs.readFileSync('src/utils/analytics.js', 'utf8');

const regex = /export const trackFirstModuleStatus = \(status\) => \{([\s\S]*?setUserProperties\(\{ first_module_status: status \}\);)(\s*)\}/;

const replacement = `export const trackFirstModuleStatus = (status) => {$1$2
        // Meta Android App Events for Retargeting Cohort (Capacitor/WebView)
        if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
            if (status === 'started') {
                window.fbq('trackCustom', 'FirstMissionStarted');
            } else if (status === 'completed') {
                window.fbq('trackCustom', 'FirstMissionCompleted');
            }
        }$2}`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/utils/analytics.js', content, 'utf8');
console.log('Fixed analytics.js for Meta events');
