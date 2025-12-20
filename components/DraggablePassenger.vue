<template>
  <div
    :draggable="true"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    :class="{ 'dragging': isDragging }"
    class="draggable-passenger list-group-item list-group-item-action"
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
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { BButton } from 'bootstrap-vue-next'

interface Props {
  passenger: {
    id?: string
    name: string
    comments?: string
  }
  passengerIndex: number
  expanded?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'toggle-comments': [index: number]
  'remove': [index: number]
  'drag-start': [passenger: { id?: string; name: string; comments?: string }, index: number]
  'drag-end': []
}>()

const isDragging = ref(false)

const onDragStart = (event: DragEvent) => {
  console.log('Drag started for passenger:', props.passenger.name)
  isDragging.value = true

  // Set drag data
  const dragData = {
    type: 'passenger',
    passenger: props.passenger,
    sourceIndex: props.passengerIndex,
    fromWaitingList: true
  }

  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', JSON.stringify(dragData))
    event.dataTransfer.effectAllowed = 'move'

    // Also set some default drag image for better UX
    const dragImage = new Image()
    dragImage.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjx0ZXh0IHg9IjAiIHk9IjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzAwN2ZmZiI+4KiCPC90ZXh0Pjwvc3ZnPg=='
    event.dataTransfer.setDragImage(dragImage, 0, 0)
  }

  emit('drag-start', props.passenger, props.passengerIndex)
}

const onDragEnd = () => {
  isDragging.value = false
  emit('drag-end')
}
</script>

<style scoped>
.draggable-passenger {
  cursor: grab;
  transition: all 0.2s ease;
  border: 1px solid #dee2e6;
  margin-bottom: 4px;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.draggable-passenger:hover {
  background-color: #f8f9fa;
  border-color: #007bff;
}

.draggable-passenger.dragging {
  opacity: 0.5;
  cursor: grabbing;
  transform: rotate(2deg);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.draggable-passenger:active {
  cursor: grabbing;
}
</style>
