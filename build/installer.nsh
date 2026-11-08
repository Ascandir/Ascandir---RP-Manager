; Beim Update bleiben die gespeicherten Zeitlinien (Ordner "data") erhalten.
!macro customInit
  IfFileExists "$INSTDIR\data\*.*" 0 swgm_no_backup
    RMDir /r "$TEMP\ascandir-swgm-backup"
    CreateDirectory "$TEMP\ascandir-swgm-backup"
    CopyFiles /SILENT "$INSTDIR\data\*.*" "$TEMP\ascandir-swgm-backup"
  swgm_no_backup:
!macroend

!macro customInstall
  IfFileExists "$TEMP\ascandir-swgm-backup\*.*" 0 swgm_no_restore
    CreateDirectory "$INSTDIR\data"
    CopyFiles /SILENT "$TEMP\ascandir-swgm-backup\*.*" "$INSTDIR\data"
    RMDir /r "$TEMP\ascandir-swgm-backup"
  swgm_no_restore:
!macroend
