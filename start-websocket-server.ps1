# PowerShell script to start the Laravel Echo Server
# This script starts the WebSocket server for chat functionality

# Check if MySQL service is running
function Check-MySQLService {
    try {
        $mysqlService = Get-Service -Name "MySQL*" -ErrorAction SilentlyContinue
        
        if ($mysqlService -and $mysqlService.Status -eq "Running") {
            Write-Host "MySQL service is running." -ForegroundColor Green
            return $true
        } else {
            Write-Host "MySQL service is not running or not found." -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host "Error checking MySQL service: $_" -ForegroundColor Red
        return $false
    }
}

# Attempt to start MySQL service if not running
function Start-MySQLService {
    try {
        $mysqlService = Get-Service -Name "MySQL*" -ErrorAction SilentlyContinue
        
        if ($mysqlService) {
            Write-Host "Starting MySQL service..." -ForegroundColor Yellow
            Start-Service -Name $mysqlService.Name
            Start-Sleep -Seconds 5
            
            if ((Get-Service -Name $mysqlService.Name).Status -eq "Running") {
                Write-Host "MySQL service started successfully." -ForegroundColor Green
                return $true
            } else {
                Write-Host "Failed to start MySQL service." -ForegroundColor Red
                return $false
            }
        } else {
            Write-Host "MySQL service not found. Please ensure MySQL is installed." -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "Error starting MySQL service: $_" -ForegroundColor Red
        return $false
    }
}

# Check and start MySQL if needed
if (-not (Check-MySQLService)) {
    $success = Start-MySQLService
    if (-not $success) {
        Write-Host "Please start MySQL manually and try again." -ForegroundColor Red
        Write-Host "Laravel Echo Server requires MySQL to be running." -ForegroundColor Red
        exit 1
    }
}

# Change to the backend directory
cd ..\UNISHARE2

# Start the Laravel Echo Server
# Make sure it's installed globally: npm install -g laravel-echo-server
Write-Host "Starting Laravel Echo Server with MySQL database..." -ForegroundColor Cyan
laravel-echo-server start
