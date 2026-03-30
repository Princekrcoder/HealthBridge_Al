const fs = require('fs');

const targetFile = 'e:\\SehatSetu AI\\frontend\\src\\app\\citizen\\dashboard\\page.jsx';

try {
    let content = fs.readFileSync(targetFile, 'utf8');

    // The problematic strings in the file look like `\`something \``
    // In JS string literal, `\` is `\\`
    // So `text += \`Risk...` becomes `text += \\`Risk...`

    const bad1 = 'text += \\`Risk Level: \\${res.risk_level}. \\`;';
    const good1 = 'text += `Risk Level: ${res.risk_level}. `;';

    const bad2 = 'text += \\`\\${res.user_message.title}. \\`;';
    const good2 = 'text += `${res.user_message.title}. `;';

    const bad3 = 'text += \\`\\${res.user_message.description}. \\`;';
    const good3 = 'text += `${res.user_message.description}. `;';

    let newContent = content;

    if (newContent.includes(bad1)) {
        console.log('Found bad1, replacing...');
        newContent = newContent.replace(bad1, good1);
    } else {
        console.log('bad1 NOT found in content');
    }

    if (newContent.includes(bad2)) {
        console.log('Found bad2, replacing...');
        newContent = newContent.replace(bad2, good2);
    } else {
        console.log('bad2 NOT found in content');
    }

    if (newContent.includes(bad3)) {
        console.log('Found bad3, replacing...');
        newContent = newContent.replace(bad3, good3);
    } else {
        console.log('bad3 NOT found in content');
    }

    if (content !== newContent) {
        fs.writeFileSync(targetFile, newContent, 'utf8');
        console.log('File updated successfully.');
    } else {
        console.log('No changes made.');
    }

} catch (err) {
    console.error('Error:', err);
}
