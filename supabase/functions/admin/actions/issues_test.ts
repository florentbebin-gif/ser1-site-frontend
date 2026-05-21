/* global Deno */
import { assertEquals } from '@std/assert'
import { collectIssueAttachmentStoragePaths } from './issues.ts'

Deno.test('collectIssueAttachmentStoragePaths extrait uniquement les chemins Storage valides', () => {
  const reports = [
    {
      attachments: [
        { storagePath: 'user-1/report.pdf', fileName: 'report.pdf' },
        { storagePath: '', fileName: 'empty.pdf' },
        { fileName: 'missing-path.pdf' },
      ],
    },
    { attachments: null },
    { attachments: { storagePath: 'not-an-array.pdf' } },
    {
      attachments: [
        { storagePath: 'user-2/capture.png', fileName: 'capture.png' },
      ],
    },
  ]

  assertEquals(collectIssueAttachmentStoragePaths(reports), [
    'user-1/report.pdf',
    'user-2/capture.png',
  ])
})
