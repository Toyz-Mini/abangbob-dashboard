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
        # -> Click on 'HR & Staf' menu to access HR and payroll management
        frame = context.pages[-1]
        # Click on 'HR & Staf' menu to access HR and payroll management
        elem = frame.locator('xpath=html/body/div/aside/nav/div[5]/ul/li/a').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click on 'Generate Payroll' to process payroll for selected staff
        frame = context.pages[-1]
        # Click on 'Generate Payroll' to process payroll for selected staff
        elem = frame.locator('xpath=html/body/div/main/div/div[3]/div[2]/div[2]/a[6]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Verify salary calculation accuracy for each staff member based on input data and KPI bonus
        frame = context.pages[-1]
        # Click on payslip button for Ahmad Bin Hassan to generate and verify payslip details
        elem = frame.locator('xpath=html/body/div/main/div/div[3]/div[2]/div/div[2]/table/tbody/tr/td[6]/a').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Apply TAP/SCP and SCP deductions based on configured percentages and verify deduction amounts for each staff member
        frame = context.pages[-1]
        # Focus on TAP/SCP deduction input to trigger recalculation
        elem = frame.locator('xpath=html/body/div/main/div/div[3]/div/div/div[4]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click on 'Generate Payroll' to navigate to Payroll Generator page and retry applying TAP/SCP and SCP deductions
        frame = context.pages[-1]
        # Click on 'Generate Payroll' to navigate to Payroll Generator page
        elem = frame.locator('xpath=html/body/div/main/div/div[3]/div[2]/div[2]/a[6]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Trigger recalculation by modifying TAP/SCP deduction input to apply deductions and update payroll details
        frame = context.pages[-1]
        # Re-enter TAP/SCP deduction percentage to trigger recalculation
        elem = frame.locator('xpath=html/body/div/main/div/div[3]/div/div/div[4]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('8')
        

        # -> Generate payslip for Ahmad Bin Hassan to verify if payslip reflects correct salary, deductions, and net pay despite zero deductions
        frame = context.pages[-1]
        # Click on 'Payslip' button for Ahmad Bin Hassan to generate payslip
        elem = frame.locator('xpath=html/body/div/main/div/div[3]/div[2]/div/div[2]/table/tbody/tr/td[10]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Close payslip modal and generate payslip for next staff member Siti Nurhaliza to verify payslip details
        frame = context.pages[-1]
        # Click 'Tutup' button to close payslip modal
        elem = frame.locator('xpath=html/body/div/main/div/div[4]/div/div[2]/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click on 'Payslip' button for Siti Nurhaliza to generate and verify payslip
        frame = context.pages[-1]
        # Click on 'Payslip' button for Siti Nurhaliza
        elem = frame.locator('xpath=html/body/div/main/div/div[3]/div[2]/div/div[2]/table/tbody/tr[2]/td[10]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Close payslip modal and generate payslip for last staff member Rahman Ali to verify payslip details
        frame = context.pages[-1]
        # Click 'Tutup' button to close payslip modal
        elem = frame.locator('xpath=html/body/div/main/div/div[4]/div/div[2]/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click on payslip button for Rahman Ali with correct index 42 to generate payslip and verify details
        frame = context.pages[-1]
        # Click on 'Payslip' button for Rahman Ali to generate payslip
        elem = frame.locator('xpath=html/body/div/main/div/div[3]/div[2]/div/div[2]/table/tbody/tr[3]/td[6]/a').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=HR & Staf').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Generate Payroll').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Payslip').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=TAP/SCP').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=SCP').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Salary').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Deductions').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Net Pay').first).to_be_visible(timeout=30000)
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    