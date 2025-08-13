<#
    Microsoft.TeamFoundation.DistributedTask.Task.Deployment.Internal.psm1
#>

# Constants #
$buildUriConstant = '/_build#_a=summary&buildId='

# TELEMETRY CODES
$telemetryCodes = 
@{
  "PREREQ_NoWinRMHTTP_Port" = "PREREQ001";
  "PREREQ_NoWinRMHTTPSPort" = "PREREQ002";
  "PREREQ_NoResources" = "PREREQ003";
  "PREREQ_NoOutputVariableForSelectActionInAzureRG" = "PREREQ004";
  "PREREQ_InvalidServiceConnectionType" = "PREREQ_InvalidServiceConnectionType";
  "PREREQ_AzureRMModuleNotFound" = "PREREQ_AzureRMModuleNotFound";
  "PREREQ_InvalidFilePath" = "PREREQ_InvalidFilePath";
  "PREREQ_StorageAccountNotFound" = "PREREQ_StorageAccountNotFound";
  "PREREQ_NoVMResources" = "PREREQ_NoVMResources";
  "PREREQ_UnsupportedAzurePSVerion" = "PREREQ_UnsupportedAzurePSVerion"; 
  "PREREQ_ClassicStorageAccountNotFound" = "PREREQ_ClassicStorageAccountNotFound";
  
  "PREREQ_RMStorageAccountNotFound" = "PREREQ_RMStorageAccountNotFound";
  
  "PREREQ_NoClassicVMResources" = "PREREQ_NoClassicVMResources";
  
  "PREREQ_NoRMVMResources" = "PREREQ_NoRMVMResources";
  
  "PREREQ_ResourceGroupNotFound" = "PREREQ_ResourceGroupNotFound";

  "AZUREPLATFORM_BlobUploadFailed" = "AZUREPLATFORM_BlobUploadFailed";
  "AZUREPLATFORM_UnknownGetRMVMError" = "AZUREPLATFORM_UnknownGetRMVMError";

  "UNKNOWNPREDEP_Error" = "UNKNOWNPREDEP001";
  "UNKNOWNDEP_Error" = "UNKNOWNDEP_Error";

  "DEPLOYMENT_Failed" = "DEP001";
  "DEPLOYMENT_FetchPropertyFromMap" = "DEPLOYMENT_FetchPropertyFromMap";
  "DEPLOYMENT_CSMDeploymentFailed" = "DEPLOYMENT_CSMDeploymentFailed";  
  "DEPLOYMENT_PerformActionFailed" = "DEPLOYMENT_PerformActionFailed";

  "FILTERING_IncorrectFormat" = "FILTERING_IncorrectFormat";
  "FILTERING_NoVMResources" = "FILTERING_NoVMResources";
  "FILTERING_MachinesNotPresentInRG" = "FILTERING_MachinesNotPresentInRG"
 }

### These constants are copied from 'Microsoft.VisualStudio.Services.DevTestLabs.Common.dll'
### [Microsoft.VisualStudio.Services.DevTestLabs.Common.DevTestLabsConstants]::WINRM_HttpTagKey - This code has been removed to remove the dependency of this psm1 with dll
$WINRM_HttpTagKey = "WinRM_Http";
$WINRM_HttpsTagKey = "WinRM_Https";
$FQDNTagKey = "Microsoft-Vslabs-MG-Resource-FQDN";
$SkipCACheckTagKey = "Microsoft-Vslabs-MG-SkipCACheck";

 # TELEMETRY FUNCTION
function Write-Telemetry
{
  [CmdletBinding()]
  param(
    [Parameter(Mandatory=$True,Position=1)]
    [string]$codeKey,

    [Parameter(Mandatory=$True,Position=2)]
    [string]$taskId
    )
  
  if($telemetrySet)
  {
    return
  }

  $code = $telemetryCodes[$codeKey]
  $telemetryString = "##vso[task.logissue type=error;code=" + $code + ";TaskId=" + $taskId + ";]"
  Write-Host $telemetryString
  $telemetrySet = $true
}

function Get-ResourceCredentials
{
    [CmdletBinding()]
    Param
    (
        [object]$resource
    )

    $machineUserName = $resource.Username
    if([string]::IsNullOrWhiteSpace($machineUserName))
    {
        throw (Get-LocalizedString -Key "Please specify valid username for resource {0}" -ArgumentList $resource.Name)
    }
    Write-Verbose "`t`t Resource Username - $machineUserName"
    
    $machinePassword = $resource.Password
    if([string]::IsNullOrWhiteSpace($machinePassword))
    {
        throw (Get-LocalizedString -Key "Please specify valid password for resource {0}" -ArgumentList $resource.Name)
    }

    $credential = New-Object 'System.Net.NetworkCredential' -ArgumentList $machineUserName, $machinePassword

    return $credential
}

function Get-ResourceOperationLogs
{
    [CmdletBinding()]
    Param
    (
        [object] [Parameter(Mandatory = $true)]
        $deploymentResponse
    )

    $log = "Copy Logs : " + $deploymentResponse.DeploymentLog + "`nService Logs : " + $deploymentResponse.ServiceLog;

    $logs = New-Object 'System.Collections.Generic.List[System.Object]'
    $resourceOperationLog = New-OperationLog -Content $log
    $logs.Add($resourceOperationLog)

    return $logs
}

function Write-ResponseLogs
{
    [CmdletBinding()]
    Param
    (
        [string] [Parameter(Mandatory = $true)]
        $operationName,

        [string] [Parameter(Mandatory = $true)]
        $fqdn,

        [object] [Parameter(Mandatory = $true)]
        $deploymentResponse
    )

    Write-Verbose "Finished $operationName operation on $fqdn"

    if ([string]::IsNullOrEmpty($deploymentResponse.DeploymentLog) -eq $false)
    {
        Write-Verbose "Deployment logs for $operationName operation on $fqdn " -Verbose
        Write-Verbose ($deploymentResponse.DeploymentLog | Format-List | Out-String) -Verbose
    }

    if ([string]::IsNullOrEmpty($deploymentResponse.ServiceLog) -eq $false)
    {
        Write-Verbose "Service logs for $operationName operation on $fqdn "
        Write-Verbose ($deploymentResponse.ServiceLog | Format-List | Out-String)
    }
}

function Get-ResourceHttpTagKey
{
    [CmdletBinding()]
    Param
    ()

    return $WINRM_HttpTagKey
}

function Get-ResourceHttpsTagKey
{
    [CmdletBinding()]
    Param
    ()

    return $WINRM_HttpsTagKey
}

function Get-ResourceFQDNTagKey
{
    [CmdletBinding()]
    Param
    ()

    return $FQDNTagKey
}

function Get-SkipCACheckTagKey
{
    [CmdletBinding()]
    Param
    ()

    return $SkipCACheckTagKey
}

function Get-OperationLogs
{
    [CmdletBinding()]
    param
    ()

    $teamFoundationCollectionUri = $env:SYSTEM_TEAMFOUNDATIONCOLLECTIONURI
    $teamProject = $env:SYSTEM_TEAMPROJECT
    $buildId = $env:BUILD_BUILDID
    #TODO: Need to fix this URL for Release.
    $buildUri = $teamFoundationCollectionUri + $teamProject + $buildUriConstant + $buildId

    $logs = New-Object 'System.Collections.Generic.List[System.Object]'
    $resourceOperationLog = New-OperationLog -Content $buildUri
    $logs.Add($resourceOperationLog)
    return $logs
}

function Get-SqlPackageCommandArguments
{
    param (
    [string]$dacpacFile,
    [string]$targetMethod,
    [string]$serverName,
    [string]$databaseName,
    [string]$sqlUsername,
    [string]$sqlPassword,
    [string]$connectionString,
    [string]$publishProfile,
    [string]$additionalArguments
    )

    $ErrorActionPreference = 'Stop'
    $dacpacFileExtension = ".dacpac"
    $SqlPackageOptions =
    @{
        SourceFile = "/SourceFile:"; 
        Action = "/Action:"; 
        TargetServerName = "/TargetServerName:";
        TargetDatabaseName = "/TargetDatabaseName:";
        TargetUser = "/TargetUser:";
        TargetPassword = "/TargetPassword:";
        TargetConnectionString = "/TargetConnectionString:";
        Profile = "/Profile:";
    }

    # validate dacpac file
    if ([System.IO.Path]::GetExtension($dacpacFile) -ne $dacpacFileExtension)
    {
        Write-Error (Get-LocalizedString -Key "Invalid Dacpac file '{0}' provided" -ArgumentList $dacpacFile)
    }

    $sqlPackageArguments = @($SqlPackageOptions.SourceFile + "`'$dacpacFile`'")
    $sqlPackageArguments += @($SqlPackageOptions.Action + "Publish")

    if($targetMethod -eq "server")
    {
        $sqlPackageArguments += @($SqlPackageOptions.TargetServerName + "`'$serverName`'")

        if ($databaseName)
        {
            $sqlPackageArguments += @($SqlPackageOptions.TargetDatabaseName + "`'$databaseName`'")
        }

        if($sqlUsername)
        {
            $sqlPackageArguments += @($SqlPackageOptions.TargetUser + "`'$sqlUsername`'")

            if (-not($sqlPassword))
            {
                Write-Error (Get-LocalizedString -Key "No password specified for the SQL User: '{0}'" -ArgumentList $sqlUserName)
            }

            $sqlPackageArguments += @($SqlPackageOptions.TargetPassword + "`'$sqlPassword`'")
        }    
    }
    elseif($targetMethod -eq "connectionString")
    {
        $sqlPackageArguments += @($SqlPackageOptions.TargetConnectionString + "`'$connectionString`'")
    }    

    if( [string]::IsNullOrWhitespace($PublishProfile) -eq $false -and $PublishProfile -ne $env:SYSTEM_DEFAULTWORKINGDIRECTORY -and $PublishProfile -ne [String]::Concat($env:SYSTEM_DEFAULTWORKINGDIRECTORY, "\"))
    {
        # validate publish profile
        if ([System.IO.Path]::GetExtension($publishProfile) -ne ".xml")
        {
            Write-Error (Get-LocalizedString -Key "Invalid Publish Profile '{0}' provided" -ArgumentList $publishProfile)
        }
        $sqlPackageArguments += @($SqlPackageOptions.Profile + "`'$publishProfile`'")
    }

    $sqlPackageArguments += @("$additionalArguments")

    $scriptArgument = '"' + ($sqlPackageArguments -join " ") + '"'

    return $scriptArgument
}
# SIG # Begin signature block
# MIIoQQYJKoZIhvcNAQcCoIIoMjCCKC4CAQExDzANBglghkgBZQMEAgEFADB5Bgor
# BgEEAYI3AgEEoGswaTA0BgorBgEEAYI3AgEeMCYCAwEAAAQQH8w7YFlLCE63JNLG
# KX7zUQIBAAIBAAIBAAIBAAIBADAxMA0GCWCGSAFlAwQCAQUABCCFUQ6Jbzpjnr9R
# vlfQAohpN4cE8boJDoOT7D3DcoNzLaCCDXYwggX0MIID3KADAgECAhMzAAAEBGx0
# Bv9XKydyAAAAAAQEMA0GCSqGSIb3DQEBCwUAMH4xCzAJBgNVBAYTAlVTMRMwEQYD
# VQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNy
# b3NvZnQgQ29ycG9yYXRpb24xKDAmBgNVBAMTH01pY3Jvc29mdCBDb2RlIFNpZ25p
# bmcgUENBIDIwMTEwHhcNMjQwOTEyMjAxMTE0WhcNMjUwOTExMjAxMTE0WjB0MQsw
# CQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9u
# ZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMR4wHAYDVQQDExVNaWNy
# b3NvZnQgQ29ycG9yYXRpb24wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIB
# AQC0KDfaY50MDqsEGdlIzDHBd6CqIMRQWW9Af1LHDDTuFjfDsvna0nEuDSYJmNyz
# NB10jpbg0lhvkT1AzfX2TLITSXwS8D+mBzGCWMM/wTpciWBV/pbjSazbzoKvRrNo
# DV/u9omOM2Eawyo5JJJdNkM2d8qzkQ0bRuRd4HarmGunSouyb9NY7egWN5E5lUc3
# a2AROzAdHdYpObpCOdeAY2P5XqtJkk79aROpzw16wCjdSn8qMzCBzR7rvH2WVkvF
# HLIxZQET1yhPb6lRmpgBQNnzidHV2Ocxjc8wNiIDzgbDkmlx54QPfw7RwQi8p1fy
# 4byhBrTjv568x8NGv3gwb0RbAgMBAAGjggFzMIIBbzAfBgNVHSUEGDAWBgorBgEE
# AYI3TAgBBggrBgEFBQcDAzAdBgNVHQ4EFgQU8huhNbETDU+ZWllL4DNMPCijEU4w
# RQYDVR0RBD4wPKQ6MDgxHjAcBgNVBAsTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEW
# MBQGA1UEBRMNMjMwMDEyKzUwMjkyMzAfBgNVHSMEGDAWgBRIbmTlUAXTgqoXNzci
# tW2oynUClTBUBgNVHR8ETTBLMEmgR6BFhkNodHRwOi8vd3d3Lm1pY3Jvc29mdC5j
# b20vcGtpb3BzL2NybC9NaWNDb2RTaWdQQ0EyMDExXzIwMTEtMDctMDguY3JsMGEG
# CCsGAQUFBwEBBFUwUzBRBggrBgEFBQcwAoZFaHR0cDovL3d3dy5taWNyb3NvZnQu
# Y29tL3BraW9wcy9jZXJ0cy9NaWNDb2RTaWdQQ0EyMDExXzIwMTEtMDctMDguY3J0
# MAwGA1UdEwEB/wQCMAAwDQYJKoZIhvcNAQELBQADggIBAIjmD9IpQVvfB1QehvpC
# Ge7QeTQkKQ7j3bmDMjwSqFL4ri6ae9IFTdpywn5smmtSIyKYDn3/nHtaEn0X1NBj
# L5oP0BjAy1sqxD+uy35B+V8wv5GrxhMDJP8l2QjLtH/UglSTIhLqyt8bUAqVfyfp
# h4COMRvwwjTvChtCnUXXACuCXYHWalOoc0OU2oGN+mPJIJJxaNQc1sjBsMbGIWv3
# cmgSHkCEmrMv7yaidpePt6V+yPMik+eXw3IfZ5eNOiNgL1rZzgSJfTnvUqiaEQ0X
# dG1HbkDv9fv6CTq6m4Ty3IzLiwGSXYxRIXTxT4TYs5VxHy2uFjFXWVSL0J2ARTYL
# E4Oyl1wXDF1PX4bxg1yDMfKPHcE1Ijic5lx1KdK1SkaEJdto4hd++05J9Bf9TAmi
# u6EK6C9Oe5vRadroJCK26uCUI4zIjL/qG7mswW+qT0CW0gnR9JHkXCWNbo8ccMk1
# sJatmRoSAifbgzaYbUz8+lv+IXy5GFuAmLnNbGjacB3IMGpa+lbFgih57/fIhamq
# 5VhxgaEmn/UjWyr+cPiAFWuTVIpfsOjbEAww75wURNM1Imp9NJKye1O24EspEHmb
# DmqCUcq7NqkOKIG4PVm3hDDED/WQpzJDkvu4FrIbvyTGVU01vKsg4UfcdiZ0fQ+/
# V0hf8yrtq9CkB8iIuk5bBxuPMIIHejCCBWKgAwIBAgIKYQ6Q0gAAAAAAAzANBgkq
# hkiG9w0BAQsFADCBiDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24x
# EDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlv
# bjEyMDAGA1UEAxMpTWljcm9zb2Z0IFJvb3QgQ2VydGlmaWNhdGUgQXV0aG9yaXR5
# IDIwMTEwHhcNMTEwNzA4MjA1OTA5WhcNMjYwNzA4MjEwOTA5WjB+MQswCQYDVQQG
# EwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwG
# A1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSgwJgYDVQQDEx9NaWNyb3NvZnQg
# Q29kZSBTaWduaW5nIFBDQSAyMDExMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIIC
# CgKCAgEAq/D6chAcLq3YbqqCEE00uvK2WCGfQhsqa+laUKq4BjgaBEm6f8MMHt03
# a8YS2AvwOMKZBrDIOdUBFDFC04kNeWSHfpRgJGyvnkmc6Whe0t+bU7IKLMOv2akr
# rnoJr9eWWcpgGgXpZnboMlImEi/nqwhQz7NEt13YxC4Ddato88tt8zpcoRb0Rrrg
# OGSsbmQ1eKagYw8t00CT+OPeBw3VXHmlSSnnDb6gE3e+lD3v++MrWhAfTVYoonpy
# 4BI6t0le2O3tQ5GD2Xuye4Yb2T6xjF3oiU+EGvKhL1nkkDstrjNYxbc+/jLTswM9
# sbKvkjh+0p2ALPVOVpEhNSXDOW5kf1O6nA+tGSOEy/S6A4aN91/w0FK/jJSHvMAh
# dCVfGCi2zCcoOCWYOUo2z3yxkq4cI6epZuxhH2rhKEmdX4jiJV3TIUs+UsS1Vz8k
# A/DRelsv1SPjcF0PUUZ3s/gA4bysAoJf28AVs70b1FVL5zmhD+kjSbwYuER8ReTB
# w3J64HLnJN+/RpnF78IcV9uDjexNSTCnq47f7Fufr/zdsGbiwZeBe+3W7UvnSSmn
# Eyimp31ngOaKYnhfsi+E11ecXL93KCjx7W3DKI8sj0A3T8HhhUSJxAlMxdSlQy90
# lfdu+HggWCwTXWCVmj5PM4TasIgX3p5O9JawvEagbJjS4NaIjAsCAwEAAaOCAe0w
# ggHpMBAGCSsGAQQBgjcVAQQDAgEAMB0GA1UdDgQWBBRIbmTlUAXTgqoXNzcitW2o
# ynUClTAZBgkrBgEEAYI3FAIEDB4KAFMAdQBiAEMAQTALBgNVHQ8EBAMCAYYwDwYD
# VR0TAQH/BAUwAwEB/zAfBgNVHSMEGDAWgBRyLToCMZBDuRQFTuHqp8cx0SOJNDBa
# BgNVHR8EUzBRME+gTaBLhklodHRwOi8vY3JsLm1pY3Jvc29mdC5jb20vcGtpL2Ny
# bC9wcm9kdWN0cy9NaWNSb29DZXJBdXQyMDExXzIwMTFfMDNfMjIuY3JsMF4GCCsG
# AQUFBwEBBFIwUDBOBggrBgEFBQcwAoZCaHR0cDovL3d3dy5taWNyb3NvZnQuY29t
# L3BraS9jZXJ0cy9NaWNSb29DZXJBdXQyMDExXzIwMTFfMDNfMjIuY3J0MIGfBgNV
# HSAEgZcwgZQwgZEGCSsGAQQBgjcuAzCBgzA/BggrBgEFBQcCARYzaHR0cDovL3d3
# dy5taWNyb3NvZnQuY29tL3BraW9wcy9kb2NzL3ByaW1hcnljcHMuaHRtMEAGCCsG
# AQUFBwICMDQeMiAdAEwAZQBnAGEAbABfAHAAbwBsAGkAYwB5AF8AcwB0AGEAdABl
# AG0AZQBuAHQALiAdMA0GCSqGSIb3DQEBCwUAA4ICAQBn8oalmOBUeRou09h0ZyKb
# C5YR4WOSmUKWfdJ5DJDBZV8uLD74w3LRbYP+vj/oCso7v0epo/Np22O/IjWll11l
# hJB9i0ZQVdgMknzSGksc8zxCi1LQsP1r4z4HLimb5j0bpdS1HXeUOeLpZMlEPXh6
# I/MTfaaQdION9MsmAkYqwooQu6SpBQyb7Wj6aC6VoCo/KmtYSWMfCWluWpiW5IP0
# wI/zRive/DvQvTXvbiWu5a8n7dDd8w6vmSiXmE0OPQvyCInWH8MyGOLwxS3OW560
# STkKxgrCxq2u5bLZ2xWIUUVYODJxJxp/sfQn+N4sOiBpmLJZiWhub6e3dMNABQam
# ASooPoI/E01mC8CzTfXhj38cbxV9Rad25UAqZaPDXVJihsMdYzaXht/a8/jyFqGa
# J+HNpZfQ7l1jQeNbB5yHPgZ3BtEGsXUfFL5hYbXw3MYbBL7fQccOKO7eZS/sl/ah
# XJbYANahRr1Z85elCUtIEJmAH9AAKcWxm6U/RXceNcbSoqKfenoi+kiVH6v7RyOA
# 9Z74v2u3S5fi63V4GuzqN5l5GEv/1rMjaHXmr/r8i+sLgOppO6/8MO0ETI7f33Vt
# Y5E90Z1WTk+/gFcioXgRMiF670EKsT/7qMykXcGhiJtXcVZOSEXAQsmbdlsKgEhr
# /Xmfwb1tbWrJUnMTDXpQzTGCGiEwghodAgEBMIGVMH4xCzAJBgNVBAYTAlVTMRMw
# EQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVN
# aWNyb3NvZnQgQ29ycG9yYXRpb24xKDAmBgNVBAMTH01pY3Jvc29mdCBDb2RlIFNp
# Z25pbmcgUENBIDIwMTECEzMAAAQEbHQG/1crJ3IAAAAABAQwDQYJYIZIAWUDBAIB
# BQCgga4wGQYJKoZIhvcNAQkDMQwGCisGAQQBgjcCAQQwHAYKKwYBBAGCNwIBCzEO
# MAwGCisGAQQBgjcCARUwLwYJKoZIhvcNAQkEMSIEIH0TVyrC3RliUwZnqcNU8315
# LM35Npg1gjgvdjQWOln8MEIGCisGAQQBgjcCAQwxNDAyoBSAEgBNAGkAYwByAG8A
# cwBvAGYAdKEagBhodHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20wDQYJKoZIhvcNAQEB
# BQAEggEAc+3V5tWmEMaAURn4wR9r11FKFX1MmgupBTbSHiM7tC9J34yRn+RXx+Iv
# Bx/HKecsJ5a3QDS3ddaPwPVE/CjcDE8VEKDjakmcZg+JoUd96hop5lOLIZVGAigs
# 7wZZ21S8eu+NqYZoLCXFGQ1n2IwAe9QWWOAUnucYG3pC4W7+FuQwuy+UXo+AEGjv
# WlvobVOEeUOWG0tF7GZiXzicB+JthJ7qckB4zb6CvJkNKwPbIO6akbFLy+Q5gS8Y
# Vj2GhHkoOAwxzdz8NYZQXy8DWLd88e7gRCOWOIUHX4rSQLh7pJJBV1bO9zCYu3C/
# DHNL2qlaqYTao8Nt/UOZPtZR7Z0KqaGCF6swghenBgorBgEEAYI3AwMBMYIXlzCC
# F5MGCSqGSIb3DQEHAqCCF4QwgheAAgEDMQ8wDQYJYIZIAWUDBAIBBQAwggFYBgsq
# hkiG9w0BCRABBKCCAUcEggFDMIIBPwIBAQYKKwYBBAGEWQoDATAxMA0GCWCGSAFl
# AwQCAQUABCDWrxNPXFRZEk9FM/eSQpeK7dZpbg9bj3Tj05ZMj26CmwIGaFLLaiYL
# GBEyMDI1MDcwMzEwNDEzMS4yWjAEgAIB9KCB2aSB1jCB0zELMAkGA1UEBhMCVVMx
# EzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoT
# FU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEtMCsGA1UECxMkTWljcm9zb2Z0IElyZWxh
# bmQgT3BlcmF0aW9ucyBMaW1pdGVkMScwJQYDVQQLEx5uU2hpZWxkIFRTUyBFU046
# MkExQS0wNUUwLUQ5NDcxJTAjBgNVBAMTHE1pY3Jvc29mdCBUaW1lLVN0YW1wIFNl
# cnZpY2WgghH7MIIHKDCCBRCgAwIBAgITMwAAAfkfZ411q6TxsQABAAAB+TANBgkq
# hkiG9w0BAQsFADB8MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQ
# MA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
# MSYwJAYDVQQDEx1NaWNyb3NvZnQgVGltZS1TdGFtcCBQQ0EgMjAxMDAeFw0yNDA3
# MjUxODMxMDlaFw0yNTEwMjIxODMxMDlaMIHTMQswCQYDVQQGEwJVUzETMBEGA1UE
# CBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9z
# b2Z0IENvcnBvcmF0aW9uMS0wKwYDVQQLEyRNaWNyb3NvZnQgSXJlbGFuZCBPcGVy
# YXRpb25zIExpbWl0ZWQxJzAlBgNVBAsTHm5TaGllbGQgVFNTIEVTTjoyQTFBLTA1
# RTAtRDk0NzElMCMGA1UEAxMcTWljcm9zb2Z0IFRpbWUtU3RhbXAgU2VydmljZTCC
# AiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBALQ9TB98gB1hzVbJQvggU4/z
# KXeeSwz7UK4Te1nqhYUXgvcSl0o6G1tWR8x1PFdgTiVImIO3wydgMRlRsqL1LYBm
# YNvhmrhSpN2Y47C0rKnoWCLFEK4F/q/1QE2lvPzjVsupTshmcGacX1dhF+KgIepm
# 9oWnQLr3W0ZdUCtbXwZUd33XggUBvsm8/SRWeOSzdqbPDXNca+NTfEItylSS2F9I
# mxGwJJLEeG27Mws72Pr3Uq41sigI0emIGIWgWg8RNigydrEERRRf3oAsSoKIHRd1
# SCaAhP1rsvTLhIMqXmtR3ou5RRr3S0GR+SaNkEebjfIYjHPGeO0USbiFgjnsiCdW
# J0Yoom6VGe9vsKb/C06L9Mh+guR0fw/PgE+L6rT+eyE17A/QzzqG/LY7bHnz3ECX
# m1DYqsn8ky+Y+fyftnfhjwnFxGKHlmfp67GUn63eQxzOKLwpg95Yn4GJ84zq8uII
# UE/3L5nR8Ba+siRqYVvxxvBkHfnAeMO8BqToR1SW8uOJBlSvDM2PbN9g8tUx5yYP
# Ke8tbBBs/wNcvOGbeoCLCE2GnHB4QSqeHDlTa36EVVMdhv9E6+w5N36QlPLvuaJa
# jz8CoGbOe45fpTq0VbF9QGBJgJ8gshq6kQM6Rl8pNR7zSAaUjTbkwUJOxQb7vmKY
# ugO0tldk4+pc2FlQb7hhAgMBAAGjggFJMIIBRTAdBgNVHQ4EFgQUie2jupyVySPX
# oo80uUJEdkZZ4AAwHwYDVR0jBBgwFoAUn6cVXQBeYl2D9OXSZacbUzUZ6XIwXwYD
# VR0fBFgwVjBUoFKgUIZOaHR0cDovL3d3dy5taWNyb3NvZnQuY29tL3BraW9wcy9j
# cmwvTWljcm9zb2Z0JTIwVGltZS1TdGFtcCUyMFBDQSUyMDIwMTAoMSkuY3JsMGwG
# CCsGAQUFBwEBBGAwXjBcBggrBgEFBQcwAoZQaHR0cDovL3d3dy5taWNyb3NvZnQu
# Y29tL3BraW9wcy9jZXJ0cy9NaWNyb3NvZnQlMjBUaW1lLVN0YW1wJTIwUENBJTIw
# MjAxMCgxKS5jcnQwDAYDVR0TAQH/BAIwADAWBgNVHSUBAf8EDDAKBggrBgEFBQcD
# CDAOBgNVHQ8BAf8EBAMCB4AwDQYJKoZIhvcNAQELBQADggIBAGYgCYBW5H+434cf
# 5pmZZxma6WnvhxqcVsbPCO/b1G/BkKLudDNZ7O4sBtgnHaF2qu1YKVZDX9bryIax
# mKSggV0PkmidjtAb8LiUe1LIE2ijdI/8n936Rw9JLR/hJBLhl7PQwS8re9YrrVZM
# KMPYkJkpOKCCvEvAKzRqUjs3rrvU3SYwY7GrJriftquU45q4BCsj3t0wKQIqPHHc
# P29XAQJo7SO7aTWFeT8kSNytTYbg4HxI+ZMpxhf7osz9Tbh0sRf1dZLP9rQhKK4o
# nDOJNTyU0wNEwozW5KZgXLADJcU8wZ1rKpwQrfXflHfVWtyMPQbOHHK5IAYy7YN7
# 2BmGq+teaH2LVPnbqfi7lNHdsAQxBtZ4Ulh2jvrtsukotwGjSDbf6TjClOpeAFtL
# g1lB9/Thx9xKhR7U7LGV2gzo7ckYG6jBppH/CiN6iFQWSdl0KZ4RLkW4fgIKZkZ/
# 2uNdA5O1bT4NrguNtliwvB/CFZPxXqIkkuLxaHYZ3BXrSdGSt+sMQGtxYj4AXm0V
# slbWe+t6gw88Q29Jgehy/RxH02zfuKBwpGWtRypfAdLPEYhQTH/1u/juxD2fsDB/
# MHZI2e0m7HXbXUYEQEakfCBT1rq0PrJ+37RIn2qI87ghGoUgHKvOso8EHkzzfWBv
# W9+EU7q55KQ/sDxkwdVnHDKbC5TNMIIHcTCCBVmgAwIBAgITMwAAABXF52ueAptJ
# mQAAAAAAFTANBgkqhkiG9w0BAQsFADCBiDELMAkGA1UEBhMCVVMxEzARBgNVBAgT
# Cldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29m
# dCBDb3Jwb3JhdGlvbjEyMDAGA1UEAxMpTWljcm9zb2Z0IFJvb3QgQ2VydGlmaWNh
# dGUgQXV0aG9yaXR5IDIwMTAwHhcNMjEwOTMwMTgyMjI1WhcNMzAwOTMwMTgzMjI1
# WjB8MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
# UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSYwJAYDVQQD
# Ex1NaWNyb3NvZnQgVGltZS1TdGFtcCBQQ0EgMjAxMDCCAiIwDQYJKoZIhvcNAQEB
# BQADggIPADCCAgoCggIBAOThpkzntHIhC3miy9ckeb0O1YLT/e6cBwfSqWxOdcjK
# NVf2AX9sSuDivbk+F2Az/1xPx2b3lVNxWuJ+Slr+uDZnhUYjDLWNE893MsAQGOhg
# fWpSg0S3po5GawcU88V29YZQ3MFEyHFcUTE3oAo4bo3t1w/YJlN8OWECesSq/XJp
# rx2rrPY2vjUmZNqYO7oaezOtgFt+jBAcnVL+tuhiJdxqD89d9P6OU8/W7IVWTe/d
# vI2k45GPsjksUZzpcGkNyjYtcI4xyDUoveO0hyTD4MmPfrVUj9z6BVWYbWg7mka9
# 7aSueik3rMvrg0XnRm7KMtXAhjBcTyziYrLNueKNiOSWrAFKu75xqRdbZ2De+JKR
# Hh09/SDPc31BmkZ1zcRfNN0Sidb9pSB9fvzZnkXftnIv231fgLrbqn427DZM9itu
# qBJR6L8FA6PRc6ZNN3SUHDSCD/AQ8rdHGO2n6Jl8P0zbr17C89XYcz1DTsEzOUyO
# ArxCaC4Q6oRRRuLRvWoYWmEBc8pnol7XKHYC4jMYctenIPDC+hIK12NvDMk2ZItb
# oKaDIV1fMHSRlJTYuVD5C4lh8zYGNRiER9vcG9H9stQcxWv2XFJRXRLbJbqvUAV6
# bMURHXLvjflSxIUXk8A8FdsaN8cIFRg/eKtFtvUeh17aj54WcmnGrnu3tz5q4i6t
# AgMBAAGjggHdMIIB2TASBgkrBgEEAYI3FQEEBQIDAQABMCMGCSsGAQQBgjcVAgQW
# BBQqp1L+ZMSavoKRPEY1Kc8Q/y8E7jAdBgNVHQ4EFgQUn6cVXQBeYl2D9OXSZacb
# UzUZ6XIwXAYDVR0gBFUwUzBRBgwrBgEEAYI3TIN9AQEwQTA/BggrBgEFBQcCARYz
# aHR0cDovL3d3dy5taWNyb3NvZnQuY29tL3BraW9wcy9Eb2NzL1JlcG9zaXRvcnku
# aHRtMBMGA1UdJQQMMAoGCCsGAQUFBwMIMBkGCSsGAQQBgjcUAgQMHgoAUwB1AGIA
# QwBBMAsGA1UdDwQEAwIBhjAPBgNVHRMBAf8EBTADAQH/MB8GA1UdIwQYMBaAFNX2
# VsuP6KJcYmjRPZSQW9fOmhjEMFYGA1UdHwRPME0wS6BJoEeGRWh0dHA6Ly9jcmwu
# bWljcm9zb2Z0LmNvbS9wa2kvY3JsL3Byb2R1Y3RzL01pY1Jvb0NlckF1dF8yMDEw
# LTA2LTIzLmNybDBaBggrBgEFBQcBAQROMEwwSgYIKwYBBQUHMAKGPmh0dHA6Ly93
# d3cubWljcm9zb2Z0LmNvbS9wa2kvY2VydHMvTWljUm9vQ2VyQXV0XzIwMTAtMDYt
# MjMuY3J0MA0GCSqGSIb3DQEBCwUAA4ICAQCdVX38Kq3hLB9nATEkW+Geckv8qW/q
# XBS2Pk5HZHixBpOXPTEztTnXwnE2P9pkbHzQdTltuw8x5MKP+2zRoZQYIu7pZmc6
# U03dmLq2HnjYNi6cqYJWAAOwBb6J6Gngugnue99qb74py27YP0h1AdkY3m2CDPVt
# I1TkeFN1JFe53Z/zjj3G82jfZfakVqr3lbYoVSfQJL1AoL8ZthISEV09J+BAljis
# 9/kpicO8F7BUhUKz/AyeixmJ5/ALaoHCgRlCGVJ1ijbCHcNhcy4sa3tuPywJeBTp
# kbKpW99Jo3QMvOyRgNI95ko+ZjtPu4b6MhrZlvSP9pEB9s7GdP32THJvEKt1MMU0
# sHrYUP4KWN1APMdUbZ1jdEgssU5HLcEUBHG/ZPkkvnNtyo4JvbMBV0lUZNlz138e
# W0QBjloZkWsNn6Qo3GcZKCS6OEuabvshVGtqRRFHqfG3rsjoiV5PndLQTHa1V1QJ
# sWkBRH58oWFsc/4Ku+xBZj1p/cvBQUl+fpO+y/g75LcVv7TOPqUxUYS8vwLBgqJ7
# Fx0ViY1w/ue10CgaiQuPNtq6TPmb/wrpNPgkNWcr4A245oyZ1uEi6vAnQj0llOZ0
# dFtq0Z4+7X6gMTN9vMvpe784cETRkPHIqzqKOghif9lwY1NNje6CbaUFEMFxBmoQ
# tB1VM1izoXBm8qGCA1YwggI+AgEBMIIBAaGB2aSB1jCB0zELMAkGA1UEBhMCVVMx
# EzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoT
# FU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEtMCsGA1UECxMkTWljcm9zb2Z0IElyZWxh
# bmQgT3BlcmF0aW9ucyBMaW1pdGVkMScwJQYDVQQLEx5uU2hpZWxkIFRTUyBFU046
# MkExQS0wNUUwLUQ5NDcxJTAjBgNVBAMTHE1pY3Jvc29mdCBUaW1lLVN0YW1wIFNl
# cnZpY2WiIwoBATAHBgUrDgMCGgMVAKrOVo1ju81QCpiHHcIaoGb8qelGoIGDMIGA
# pH4wfDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcT
# B1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UE
# AxMdTWljcm9zb2Z0IFRpbWUtU3RhbXAgUENBIDIwMTAwDQYJKoZIhvcNAQELBQAC
# BQDsEGacMCIYDzIwMjUwNzAzMDIxNzAwWhgPMjAyNTA3MDQwMjE3MDBaMHQwOgYK
# KwYBBAGEWQoEATEsMCowCgIFAOwQZpwCAQAwBwIBAAICExcwBwIBAAICHkMwCgIF
# AOwRuBwCAQAwNgYKKwYBBAGEWQoEAjEoMCYwDAYKKwYBBAGEWQoDAqAKMAgCAQAC
# AwehIKEKMAgCAQACAwGGoDANBgkqhkiG9w0BAQsFAAOCAQEANkCBbyr7U6jcF2Pv
# 1M2cVxhMUEZCZuZHKl0swXZA8nGpX3m954lOOgvi/nOoBLtgS0SeZ8IJoSeYEWh4
# UtotvUy4HJroWX0MMZJPAHXIyscdXvF3u4aEXIo0phiScnFiXVVyZVVZg8LolKV6
# DXMHbFst80j/2SyQPDfaFVifj7Bpq4ATAkhPgnduoqBHIkW+udZP6O9sD5s9vGoi
# u5v7B+klE3NqVGxKln+ANaQOtkg55ec1bFwcaY4ETuh75rFIWoypiUAi1HqrIoL6
# 5vKZHHHISCryaVp6m4UWewnJAI0vh2xusUbIjMu97B23d4pLXsQntZzhqJTRlb2M
# SiarEjGCBA0wggQJAgEBMIGTMHwxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNo
# aW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29y
# cG9yYXRpb24xJjAkBgNVBAMTHU1pY3Jvc29mdCBUaW1lLVN0YW1wIFBDQSAyMDEw
# AhMzAAAB+R9njXWrpPGxAAEAAAH5MA0GCWCGSAFlAwQCAQUAoIIBSjAaBgkqhkiG
# 9w0BCQMxDQYLKoZIhvcNAQkQAQQwLwYJKoZIhvcNAQkEMSIEIBn4ushOon5xZ4Eh
# 1Wg7IHDO5stVvAfdh2UrYc4JpgxjMIH6BgsqhkiG9w0BCRACLzGB6jCB5zCB5DCB
# vQQgOSOMyB7wjftk+ukVDiwma1BFXaCpSpfFXgjuUmxi2BAwgZgwgYCkfjB8MQsw
# CQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9u
# ZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSYwJAYDVQQDEx1NaWNy
# b3NvZnQgVGltZS1TdGFtcCBQQ0EgMjAxMAITMwAAAfkfZ411q6TxsQABAAAB+TAi
# BCA7xX7Yj2TsdN/asRgxB1JXX+EtdbmT9t2sncHCflH/ujANBgkqhkiG9w0BAQsF
# AASCAgAUj6Y01ViLVCWzDTJrZ/elwH72gT9YsVkrYONV5c5RrRNN1tApEb/kx8QB
# hbxpropRt7UjFvyiZZ0PVtfxMnnosO1m15LuuPukwBfBNljQxPVRDAKXdIRa3h3e
# o2Fj1yKqqPGDdlzTB7pr1nhcKmVlm5NzrIxXd1fWNWvBWIkItmft1fATdZjNY8qs
# LtYFK5bmGRkG3cuQ7vuFgxqsRBMreFOt4A9Xur7UGhOGetALqMnD/e8U7z6OuE6w
# GMZEW7L6J7TWcUeNj2aotqfuCnq+7fFvokEpzfrkBstlej4IzJxNdXJZl7StO1n2
# Wv5JUb2+SGUuUmqIyWKpjiv+yH01rk+uPzXmmiS3pAEJBRV011fDy+XcMds3eOVs
# Ngk6VvdzpaVA3rKRYqElDUnwuDmG+1I9NSZ5Evm/bC+MOuU+K7efCuljPcjSzfxE
# lvzF+Gu/VDC6NC9j4UUqElGJBX+fGULs1mX6PbDjsHyTdlC5Gg3GztDlKVgLiu1i
# BytEZqoENkOtTPrt6yaG6wrzTBSrgAnYaxV2+QpguARtyN4jQKX1T+3YE4HcPY+7
# 2bvWxwSSZerFPqIp0r8ls83mDfUAwrFGBY8d8/H+zke4TSgQgONW3EY63qhqR+Fa
# tzAafbn+rrxgcU2e1seHBo2+4koGHIa4xfc/ALAqCEirFhoZ2w==
# SIG # End signature block
