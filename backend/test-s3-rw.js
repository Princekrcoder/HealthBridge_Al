require("dotenv").config();
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const https = require('https');

async function testS3ReadWrite() {
    console.log("🚀 Testing AWS S3 Read/Write Access...");

    const s3 = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    });

    const bucketName = process.env.AWS_BUCKET_NAME;
    const fileName = `test-rw-${Date.now()}.txt`;
    const fileContent = "This file verifies that HealthBridge S3 is writable AND readable.";
    const fileUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

    try {
        // 1. UPLOAD
        console.log(`\n📤 1. Attempting Upload to: ${bucketName}/${fileName}`);
        await s3.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: fileName,
            Body: fileContent,
            ContentType: "text/plain",
            // ACL: 'public-read' // Uncomment if you rely on ACLs, but bucket settings usually control this
        }));
        console.log("✅ Upload Successful!");

        // 2. READ (Download via HTTPS)
        console.log(`\n📥 2. Attempting Public Read from: ${fileUrl}`);

        await new Promise((resolve, reject) => {
            https.get(fileUrl, (res) => {
                if (res.statusCode === 200) {
                    console.log("✅ Read Successful! (HTTP 200)");
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        if (data === fileContent) {
                            console.log("✅ Content Verified Match!");
                        } else {
                            console.warn("⚠️ Content Mismatch (might be caching or partial)");
                        }
                        resolve();
                    });
                } else {
                    console.error(`❌ Read Failed! Status Code: ${res.statusCode}`);
                    if (res.statusCode === 403) {
                        console.error("   Reason: Permission Denied (403). check Bucket Policy or Public Access settings.");
                    } else if (res.statusCode === 404) {
                        console.error("   Reason: File Not Found (404). Propagation delay?");
                    }
                    reject(new Error(`HTTP ${res.statusCode}`));
                }
            }).on('error', (err) => {
                console.error("❌ Network Error during Read:", err.message);
                reject(err);
            });
        });

        // 3. CLEANUP (Delete the test file)
        console.log(`\n🗑️ 3. Cleaning up (Deleting test file)...`);
        await s3.send(new DeleteObjectCommand({
            Bucket: bucketName,
            Key: fileName
        }));
        console.log("✅ Cleanup Successful!");

    } catch (error) {
        console.error("\n❌ S3 Test Failed:", error.message);
    }
}

testS3ReadWrite();
