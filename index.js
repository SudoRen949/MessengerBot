
//////////////////////////////////////////////
//
//	Messenger AI Bot
//
//	By: 			Renato Catucod Jr.
//	Date Created: 	Sep. 28, 2026
//
//////////////////////////////////////////////

require('dotenv').config();

const { chromium } 	= require('playwright-core');
/*
const OpenAI 		= require('openai');
const groq = new OpenAI({
	apiKey: process.env.GROQ_KEY,
	baseURL: "https://api.groq.com/openai/v1"
});
*/

(async () => {

	let lastReply 	= [ null, null ];
	let lastSeen 	= [ null, null ];

	console.log("Connecting to remote Chrome");
	
	const context = await chromium.launchPersistentContext('./fb_session');
	
	const page = await context.newPage();

	console.log("Opening Messenger...");
	
	await page.goto('https://www.messenger.com/t/', { waitUntil: "domcontentloaded" });
	
	await page.locator("body").waitFor();
	
	async function generateReply(msg) {
	
		/*
		const response = await groq.responses.create({
		
			model: 'openai/gpt-oss-20b',
			
			temperature: 0.3,
			
			max_output_tokens: 300,
			
			instructions: `
				You are an AI assistant.
				Follow these rules:
				1. Reply helpfully and accurately.
				2. Use a concise, polished, professional assistant tone.
				3. Use "sir" when someone is asking for Me.
				4. Use "ma'am/sir" only when answering a question.
				5. Do not use "sir" or "ma'am" awkwardly in every sentence.
				6. If you do not know something, say so instead of inventing an answer.
			`,
			
			input: `Respond to this message: ${ msg }`
		
		});
		
		return await response.output_text;
		*/
		
		const hour = new Date().getHours();
		
		if ( hour >= 1 && hour <= 6 ) {
		
			return "<Type anything here>";
		
		} else {
			
			// Wait 2 min to check if renato has responded to the message
			
			const myBaloon0 = await page.locator('div[aria-roledescription="message"][data-scope="messages_table"][aria-label*="You"]').last().getAttribute("aria-label");
			const myMessage0 = myBaloon0?.split("You: ")[1]?.toLowerCase();
			
			await page.waitForTimeout(120 * 1000);
			
			const myBaloon1 = await page.locator('div[aria-roledescription="message"][data-scope="messages_table"][aria-label*="You"]').last().getAttribute("aria-label");
			const myMessage1 = myBaloon1?.split("You: ")[1]?.toLowerCase();
			
			if ( myBaloon0 == null && myBaloon1 == null ) return null;
			
			await page.waitForTimeout(500);
			
			if ( btoa(myMessage1) != btoa(myMessage0) ) {
			
				return null;
			
			} else {
			
				return "<Type anythig here>";
			
			}
		
		}
	
	}
	
	async function checkPM() {
	
		const message = page.locator('div[role="row"] a[href*="/t/"]:not([aria-label*="Group"])').first();
		
		if ( await message.count() > 0 ) await message.click();
		
		await page.waitForTimeout(2000);
		
		// Make sure she can type
		
		const input = page.locator('div[aria-label*="Write to"]');
		
		if ( await input.count() > 0 ) await input.click();
		
		await page.waitForTimeout(2000);
		
		// Write a new message
		
		const theirBaloon = page.locator('div[aria-roledescription="message"][data-scope="messages_table"]:not([aria-label*="You"])').last();
		
		if ( await theirBaloon.count() > 0 ) {
		
			const theirMessage = await theirBaloon.innerText();
			
			if ( theirMessage && theirMessage !== lastSeen[0] && theirMessage.length < 512 ) {
			
				lastSeen[0] = theirMessage;
				
				const msg = theirMessage.toLowerCase();
				
				console.log(`Message (PM): ${ msg }`);
				
				const response = await generateReply(msg);
				
				if ( response !== null ) {
				
					await page.keyboard.type(`${ response }`,{ delay: 80 });
					await page.keyboard.press('Enter');
				
				}
			
			}
		
		}
	
	}
	
	async function checkGC() {
	
		const message = page.locator('div[role="row"] a[href*="/t/"][aria-label*="Group"]').first();
		
		if ( await message.count() > 0 ) await message.click();
		
		await page.waitForTimeout(2000);
		
		// Make sure she can type
		
		const input = page.locator('div[aria-label*="Write to"]');
		
		if ( await input.count() > 0 ) await input.click();
		
		await page.waitForTimeout(2000);
		
		// Write a new message
		
		const chatBubble = page.locator('div[aria-roledescription="message"][data-scope="messages_table"]:not([aria-label*="You"])').last();
		
		if ( await chatBubble.count() > 0 ) {
		
			const latest = await chatBubble.innerText();
			
			if ( latest && latest !== lastSeen[1] && latest.length < 512 ) {
			
				lastSeen[1] = latest;
				
				const msg = latest.toLowerCase();
				const hour = new Date().getHours();
				
				// Check for my name
				
				const me = /\b(?: <type anything here> )\b/i.test(msg);
				
				if ( !me ) {
				
					console.log("Message (GC): No one is mentioning you.");
					
					return;
				
				}
				
				console.log(`Message (GC): ${ msg }`);
				
				const response = await generateReply(msg);
				
				if ( response !== null ) {
				
					await page.keyboard.type(`${ response }`,{ delay: 80 });
					await page.keyboard.press('Enter');
				
				}
			
			}
		
		}
	
	}
	
	console.log("Logging in...");
	
	await page.waitForTimeout(5000);
	
	// Automatically log in if logged out
	
	const emailInput = page.locator('input#email');
	const emailInputValue = await emailInput.inputValue();
	
	if ( await emailInput.count() > 0 && emailInputValue.length > 0 ) {
	
		const login = page.locator('button#loginbutton');
		
		if ( await login.count() > 0 ) await login.click();
	
	} else {
	
		if ( await emailInput.count() > 0 ) {
		
			await emailInput.click();
			await page.waitForTimeout(2000);
			await page.keyboard.type(process.env.FB_EMAIL);
			await page.waitForTimeout(2000);
			
			const passwInput = page.locator('input#pass');
			
			if ( await passwInput.count() > 0 ) {
			
				await passwInput.click();
				await page.waitForTimeout(2000);
				await page.keyboard.type(process.env.FB_PASSW);
				await page.keyboard.press("Enter");
			
			}
		
		} else {
		
			const login = page.locator('button#loginbutton');
			
			if ( await login.count() > 0 ) await login.click();
		
		}
		
	}
	
	// await page.waitForTimeout(10000);
	
	// await page.screenshot({ path: 'result.png' });
	
	// return;
	
	await page.waitForTimeout(5000);
	
	const chatTab = page.locator('a[href*="/t/"][aria-label*="unread"]').first();
	
	if ( await chatTab.count() > 0 ) await chatTab.click();
	
	await page.waitForTimeout(5000);
	
	console.log("Bot is now active");
	
	while ( true ) {
	
		await page.waitForTimeout(5000);
		
		// Check for Private Messages
		
		await checkPM();
		
		await page.waitForTimeout(5000);
		
		// Check for Group chat mentions
		
		await checkGC();
	
	}

})();





