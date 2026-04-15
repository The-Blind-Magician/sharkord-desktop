!macro customRemoveFiles
  ; Backup config.ini before old version files are removed during upgrade uninstall step
  IfFileExists "$INSTDIR\config.ini" 0 +3
  CreateDirectory "$APPDATA\Sharkord"
  CopyFiles /SILENT "$INSTDIR\config.ini" "$APPDATA\Sharkord\config.ini.backup"
!macroend

!macro customInstall
  ; Restore config.ini into the new install directory after upgrade install step
  IfFileExists "$APPDATA\Sharkord\config.ini.backup" 0 +4
  CopyFiles /SILENT "$APPDATA\Sharkord\config.ini.backup" "$INSTDIR\config.ini"
  Delete "$APPDATA\Sharkord\config.ini.backup"
  Goto +2
  IfFileExists "$APPDATA\Sharkord\config.ini" 0 +2
  CopyFiles /SILENT "$APPDATA\Sharkord\config.ini" "$INSTDIR\config.ini"
!macroend
