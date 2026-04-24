import { Box } from '@mui/material'

const GoalPage: React.FC = () => {
  return (
    <Box sx={{ height: 'calc(100vh - 64px)', width: '100%' }}>
      <iframe
        src="/safety-goal-2025.html"
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="팬오션 안전보건 목표 2025"
      />
    </Box>
  )
}

export default GoalPage
