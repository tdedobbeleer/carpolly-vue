<template>
  <div
    @click="toggleMoveMode"
    :class="{
      'passenger-move-mode': isInMoveMode,
      'passenger-move-candidate': isMoveCandidate,
      'click-to-move': !isInMoveMode
    }"
    class="passenger-item list-group-item list-group-item-action"
    :data-passenger-index="passengerIndex"
  >
    {{ passenger.name }}
    <div class="float-end">
      <BButton v-if="passenger.comments" class="btn-sm me-1" @click.stop="$emit('toggle-comments', passengerIndex)">
        <i class="bi bi-chat-left-text"></i>
      </BButton>
      <BButton class="btn-sm" variant="outline-danger" @click.stop="$emit('remove', passengerIndex)">
        <i class="bi bi-trash3"></i>
      </BButton>
    </div>
    <div v-if="expanded && passenger.comments" class="mt-2">
      <i>{{ passenger.comments }}</i>
    </div>

    <!-- Move mode indicator -->
    <div v-if="isInMoveMode" class="move-mode-indicator">
      <small class="text-muted">
        <i class="bi bi-arrow-left-right"></i> Click a driver below to move
      </small>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { BButton } from 'bootstrap-vue-next'

interface Props {
  passenger: {
    id?: string
    name: string
    comments?: string
  }
  passengerIndex: number
  expanded?: boolean
  // New props for move mode
  passengerToMove?: { id?: string; name: string; comments?: string } | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'toggle-comments': [index: number]
  'remove': [index: number]
  'start-moving-passenger': [passenger: { id?: string; name: string; comments?: string } | null, index: number]
  'move-passenger-to-driver': [driverIndex: number]
}>()

// Check if this passenger is currently being moved
const isInMoveMode = computed(() => {
  return props.passengerToMove?.id === props.passenger.id
})

// Check if this passenger is the one that will be moved (when another passenger is selected)
const isMoveCandidate = computed(() => {
  return props.passengerToMove && props.passengerToMove.id !== props.passenger.id
})

const toggleMoveMode = () => {
  if (isInMoveMode.value) {
    // Cancel move mode
    emit('start-moving-passenger', null, -1)
  } else {
    // Start move mode for this passenger
    console.log('Starting move mode for passenger:', props.passenger.name)
    emit('start-moving-passenger', props.passenger, props.passengerIndex)
  }
}
</script>

<style scoped>
.passenger-item {
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #dee2e6;
  margin-bottom: 4px;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.passenger-item:hover {
  background-color: #f8f9fa;
  border-color: #007bff;
}

.passenger-item.click-to-move {
  cursor: pointer;
}

.passenger-item.passenger-move-mode {
  opacity: 0.7;
  border-color: #28a745;
  background-color: #d4edda;
  transform: scale(0.98);
  box-shadow: 0 2px 4px rgba(40, 167, 69, 0.2);
}

.passenger-item.passenger-move-candidate {
  opacity: 0.5;
}

.passenger-item:active {
  transform: scale(0.97);
}

.move-mode-indicator {
  margin-top: 8px;
  padding: 4px 8px;
  background-color: #e7f3ff;
  border-radius: 4px;
  border: 1px solid #b8daff;
}

/* Touch device styles */
@media (hover: none) and (pointer: coarse) {
  .passenger-item {
    cursor: default;
    -webkit-tap-highlight-color: transparent;
  }

  .passenger-item:active {
    background-color: #e9ecef;
  }
}
</style>
