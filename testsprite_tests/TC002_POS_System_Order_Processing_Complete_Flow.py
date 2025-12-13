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
        # -> Click on the POS link to open the POS interface for menu browsing.
        frame = context.pages[-1]
        # Click on POS link to open POS interface
        elem = frame.locator('xpath=html/body/div/aside/nav/div[3]/ul/li/a').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select a menu category and choose an item to add modifiers.
        frame = context.pages[-1]
        # Click on 'Nasi Lemak' category to browse items
        elem = frame.locator('xpath=html/body/div/main/div/div[3]/div/div/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select 'Nasi Lemak Ayam' item to add modifiers if available.
        frame = context.pages[-1]
        # Select 'Nasi Lemak Ayam' item to add modifiers
        elem = frame.locator('xpath=html/body/div/main/div/div[3]/div/div[2]/div').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Check for available modifiers for 'Nasi Lemak Ayam' and add any with quantity and price adjustments.
        frame = context.pages[-1]
        # Click on 'Nasi Lemak Ayam' to check for modifiers
        elem = frame.locator('xpath=html/body/div/main/div/div[3]/div/div[2]/div').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Try selecting another menu category or item to check for modifiers, or report the issue if no modifiers are found.
        frame = context.pages[-1]
        # Click on 'Burger' category to check for items with modifiers
        elem = frame.locator('xpath=html/body/div/main/div/div[3]/div/div/button[3]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select 'Burger Ayam' item to check for available modifiers and add to cart.
        frame = context.pages[-1]
        # Select 'Burger Ayam' item to check for modifiers
        elem = frame.locator('xpath=html/body/div/main/div/div[3]/div/div[2]/div').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Apply a valid discount code or select a discount percentage to test discount application.
        frame = context.pages[-1]
        # Apply 5% discount to the cart
        elem = frame.locator('xpath=html/body/div/main/div/div[3]/div[2]/div/div[3]/div/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Proceed to checkout to select order type (dine-in, takeaway, delivery).
        frame = context.pages[-1]
        # Click Checkout button to proceed to order type selection
        elem = frame.locator('xpath=html/body/div/main/div/div[3]/div[2]/div/div[4]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click 'Teruskan Checkout' button to proceed to order type selection.
        frame = context.pages[-1]
        # Click 'Teruskan Checkout' to proceed to order type selection
        elem = frame.locator('xpath=html/body/div/main/div/div[4]/div/div[2]/div[3]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select 'Takeaway' order type, enter a valid phone number, and proceed to payment.
        frame = context.pages[-1]
        # Select 'Takeaway' order type
        elem = frame.locator('xpath=html/body/div/main/div/div[4]/div/div[2]/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        frame = context.pages[-1]
        # Enter valid phone number for takeaway order
        elem = frame.locator('xpath=html/body/div/main/div/div[4]/div/div[2]/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('+67371234567')
        

        frame = context.pages[-1]
        # Click 'Bayar' button to proceed to payment
        elem = frame.locator('xpath=html/body/div/main/div/div[4]/div/div[2]/div[3]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Verify the order appears in the order queue with correct details and status, then test receipt printing.
        frame = context.pages[-1]
        # Close order confirmation modal
        elem = frame.locator('xpath=html/body/div/main/div/div[4]/div').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        frame = context.pages[-1]
        # Click on 'Order Queue' to verify the order appears in the queue
        elem = frame.locator('xpath=html/body/div/aside/nav/div[6]/ul/li[2]/a').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click the 'Cetak Resit' button to test receipt printing functionality.
        frame = context.pages[-1]
        # Click 'Cetak Resit' button to print the receipt
        elem = frame.locator('xpath=html/body/div/aside/nav/div[3]/ul/li[4]/a').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        try:
            await expect(frame.locator('text=Order Completed Successfully').first).to_be_visible(timeout=1000)
        except AssertionError:
            raise AssertionError("Test case failed: The POS system did not complete the order as expected. The order did not appear in the order queue with correct details and status, or the receipt printing option was not available or did not print correct details.")
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    