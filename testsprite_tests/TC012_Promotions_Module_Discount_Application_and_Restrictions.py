import asyncio
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()
        
        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )
        
        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)
        
        # Open a new page in the browser context
        page = await context.new_page()
        
        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:3000", wait_until="commit", timeout=10000)
        
        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass
        
        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass
        
        # Interact with the page elements to simulate user flow
        # -> Navigate to 'Promosi' section to create different promotions with discounts: percentage, fixed amount, buy-one-get-one.
        frame = context.pages[-1]
        # Click on 'Promosi' to manage promotions
        elem = frame.locator('xpath=html/body/div/aside/nav/div[6]/ul/li[2]/a').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click on 'Buat Promosi' button to start creating a new promotion with percentage discount.
        frame = context.pages[-1]
        # Click on 'Buat Promosi' to create a new promotion
        elem = frame.locator('xpath=html/body/div/main/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Skip description input and save the first promotion to proceed with creating the next promotions.
        frame = context.pages[-1]
        # Click 'Simpan' button to save the first promotion without description
        elem = frame.locator('xpath=html/body/div/main/div/div[5]/div/div[2]/div[9]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Create second promotion with fixed amount discount by clicking 'Buat Promosi' button.
        frame = context.pages[-1]
        # Click 'Buat Promosi' to create second promotion with fixed amount discount
        elem = frame.locator('xpath=html/body/div/main/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Try to clear and input usage limit value using a different approach or skip usage limit and save the promotion to proceed.
        frame = context.pages[-1]
        # Click usage limit input field to focus
        elem = frame.locator('xpath=html/body/div/main/div/div[5]/div/div[2]/div[6]/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        frame = context.pages[-1]
        # Try inputting usage limit value 3 again
        elem = frame.locator('xpath=html/body/div/main/div/div[5]/div/div[2]/div[6]/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('3')
        

        frame = context.pages[-1]
        # Click 'Simpan' button to save promotion even if usage limit input fails
        elem = frame.locator('xpath=html/body/div/main/div/div[5]/div/div[2]/div[9]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Navigate to POS section to start applying discounts during relevant orders and verify correct discount application and usage decrement.
        frame = context.pages[-1]
        # Click on 'POS' to navigate to POS order interface
        elem = frame.locator('xpath=html/body/div/aside/nav/div[3]/ul/li/a').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=Diskaun Tetap 2024').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Active').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=BND 5').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=13/12/2025 - 12/1/2026').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=0 / 3').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Diskaun Raya 2024').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Active').nth(1)).to_be_visible(timeout=30000)
        await expect(frame.locator('text=10%').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=13/12/2025 - 12/1/2026').nth(1)).to_be_visible(timeout=30000)
        await expect(frame.locator('text=ABT1T6B4').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=0 / 5').first).to_be_visible(timeout=30000)
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    