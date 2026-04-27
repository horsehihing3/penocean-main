// [2026-04-25] safety_rules.html을 iframe으로 표시
import { Box, Typography } from '@mui/material'

const SafetyRulePage: React.FC = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
    <Typography variant="h5" sx={{ fontWeight: 700 }}>안전수칙 등록</Typography>
    <Box sx={{ flex: 1, border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
      <iframe
        src="/safety_rules.html"
        style={{ width: '100%', height: '100%', minHeight: '75vh', border: 'none' }}
        title="안전수칙 관리"
      />
    </Box>
  </Box>
)

export default SafetyRulePage
