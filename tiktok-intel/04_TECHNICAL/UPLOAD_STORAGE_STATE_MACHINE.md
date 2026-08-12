# Upload/Storage State Machine V1.6

`REQUESTED → UPLOADING → UPLOADED → SCANNING → QUARANTINED/ACCEPTED → PARSING → VALIDATING → READY/FAILED → DELETED`

Rules:
- Upload URL expires.
- Storage key is server-generated.
- Client cannot choose arbitrary bucket/path.
- Content type and size are checked server-side.
- Hash is calculated server-side.
- Malware/file safety scanning occurs before parsing.
- Failed/quarantined files are not parsed.
- Deleted imports retain audit metadata but remove file access.
- Storage objects are tenant-scoped.
