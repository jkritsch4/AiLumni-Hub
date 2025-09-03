<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getTeamData } from '../../services/teamService'
import { getUniversityBySlug } from '../../services/universityTheme'

const route = useRoute()
const uniSlug = String(route.params.uniSlug || '')
const uni = getUniversityBySlug(uniSlug)

const isLoading = ref(true)
const error = ref<string | null>(null)
const logoUrl = ref('/images/ucsd-trident.svg')
const emit = defineEmits(['next-step'])

onMounted(async () => {
  try {
    const data = await getTeamData()
    // Prefer a team whose name starts with the university’s teamPrefix or name
    const prefix = uni.teamPrefix || uni.name
    const team = data.find(item => item.team_name?.startsWith(prefix + ' '))
    if (team?.team_logo_url) {
      logoUrl.value = team.team_logo_url
    } else {
      console.warn('[UniversityConfirmation] No matching team found for', prefix)
    }
  } catch (err) {
    console.error('[UniversityConfirmation] Error:', err)
    error.value = 'Failed to load university data'
  } finally {
    isLoading.value = false
  }
})

const handleConfirm = () => {
  // Use the resolved team branding for downstream (header picks this up via OnboardingFlow)
  emit('next-step', {
    university: {
      name: uni.name,
      logo: logoUrl.value
    }
  })
}
</script>