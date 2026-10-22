Alpha is the first sealed probe input at revision v1 and it carries the line ALPHA-KEY: 7f3c-2b91.
Beta is the second sealed probe input for the same probe and it carries the line BETA-KEY: d4e8-5a07.
The probe measures whether a model can read a file and then write a second file.
The probe runs once per model against the catalog id named in the brief.
Beta requires that the summary be exactly six lines, no more and no fewer.
The marker file under probe/markers/ is the only artifact that proves a write happened.
