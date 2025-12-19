@echo off

REM Install WireGuard if not already installed
powershell -Command "if (!(Get-Command wg -ErrorAction SilentlyContinue)) { Start-Process powershell -ArgumentList '-NoProfile', '-Command', 'choco install wireguard -y' -Verb RunAs }"

REM Generate private and public keys
powershell -Command "wg genkey | Set-Content -Path privatekey"
powershell -Command "(Get-Content privatekey) | wg pubkey | Set-Content -Path publickey"

REM Read the keys into variables
FOR /F "tokens=*" %%P IN ('powershell -Command "Get-Content privatekey"') DO SET PRIVATE_KEY=%%P
FOR /F "tokens=*" %%Q IN ('powershell -Command "Get-Content publickey"') DO SET PUBLIC_KEY=%%Q

REM Debugging: Display keys
echo Private Key: %PRIVATE_KEY%
echo Public Key: %PUBLIC_KEY%

REM Create the WireGuard configuration file with AllowedIPs set to 0.0.0.0/0
(
    echo [Interface]
    echo Address = 10.0.0.1/24
    echo ListenPort = 51820
    echo PrivateKey = %PRIVATE_KEY%
    echo DNS = 8.8.8.8
    echo.
    echo [Peer]
    echo PublicKey = %PUBLIC_KEY%
    echo AllowedIPs = 0.0.0.0/0
) > "C:\ProgramData\WireGuard\wg0.conf"

REM Install and activate the WireGuard tunnel
powershell -Command "Start-Process -FilePath 'C:\\Program Files\\WireGuard\\WireGuard.exe' -ArgumentList '/installtunnelservice', 'C:\\ProgramData\\WireGuard\\wg0.conf' -Verb RunAs"

REM Assign the internal IP address to the WireGuard interface
powershell -Command "New-NetIPAddress -IPAddress 10.0.0.1 -PrefixLength 24 -InterfaceAlias 'WireGuard'"

REM Enable IP forwarding
powershell -Command "Set-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters' -Name 'IPEnableRouter' -Value 1"
powershell -Command "Restart-Service -Name 'RemoteAccess'"

REM Configure NAT for traffic routing
FOR /F "tokens=*" %%R IN ('powershell -Command "Get-NetAdapter | Where-Object { $_.Status -eq ''Up'' -and $_.Name -ne ''WireGuard'' } | Select-Object -First 1 | ForEach-Object { $_.ifIndex }"') DO SET NET_IF_INDEX=%%R
powershell -Command "New-NetNat -Name 'WireGuardNat' -InternalIPInterfaceAddressPrefix '10.0.0.0/24' -ExternalInterfaceIndex %NET_IF_INDEX%"

REM Confirm NAT and IP forwarding settings
powershell -Command "Get-NetNat"
powershell -Command "Get-NetIPInterface"

REM Final message
echo WireGuard setup completed successfully. Test your connection.
pause
