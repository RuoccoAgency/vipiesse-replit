const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'server', 'routes.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Fix systematic space corruption in HTML tags
// < div class="container" > -> <div class="container">
content = content.replace(/ < (!DOCTYPE html) > /g, '<!DOCTYPE html>');
content = content.replace(/ < (\/?(html|head|title|meta|style|body|div|nav|a|h1|h2|h3|p|span|section|form|label|input|select|option|button|textarea|table|thead|tbody|tr|th|td|svg|path|polyline|line|small|strong|ul|li|i|b|u))([ >])/g, (match, tag, name, char) => {
    return '<' + tag + char;
});

// Fix end tags: < / div > -> </div>
content = content.replace(/ < \/ ([a-z0-9]+) >/gi, '</$1>');
content = content.replace(/ < \/ (style|body|html|head) >/gi, '</$1>');

// Fix attributes and properties
content = content.replace(/ = "/g, '="');
content = content.replace(/" >/g, '">');
content = content.replace(/ - /g, '-'); // Dangerous? Mostly used in CSS properties and slugify
content = content.replace(/box- sizing/g, 'box-sizing');
content = content.replace(/font- family/g, 'font-family');
content = content.replace(/font- weight/g, 'font-weight');
content = content.replace(/font- size/g, 'font-size');
content = content.replace(/justify- content/g, 'justify-content');
content = content.replace(/align- items/g, 'align-items');
content = content.replace(/border- radius/g, 'border-radius');
content = content.replace(/margin- bottom/g, 'margin-bottom');
content = content.replace(/padding- bottom/g, 'padding-bottom');
content = content.replace(/border- bottom/g, 'border-bottom');
content = content.replace(/ - content/g, '-content');
content = content.replace(/ - row/g, '-row');
content = content.replace(/ - group/g, '-group');
content = content.replace(/ - grid/g, '-grid');
content = content.replace(/ - card/g, '-card');
content = content.replace(/ - link/g, '-link');
content = content.replace(/ - progress/g, '-progress');
content = content.replace(/ - bar/g, '-bar');
content = content.replace(/ - fill/g, '-fill');
content = content.replace(/ - text/g, '-text');
content = content.replace(/ - badge/g, '-badge');
content = content.replace(/ - delete - btn/g, '-delete-btn');
content = content.replace(/ - zone/g, '-zone');
content = content.replace(/ - small/g, '-small');
content = content.replace(/ - secondary/g, '-secondary');
content = content.replace(/ - danger/g, '-danger');

// Fix comments
content = content.replace(/< !--/g, '<!--');
content = content.replace(/-- >/g, '-->');

// Fix specific broken tags
content = content.replace(/< style >/g, '<style>');
content = content.replace(/< body >/g, '<body>');
content = content.replace(/< \/body >/g, '</body>');
content = content.replace(/< html >/g, '<html>');
content = content.replace(/< \/html >/g, '</html>');

fs.writeFileSync(filePath, content);
console.log('Successfully refined server/routes.ts');
