<template>
  <div v-if="showDebug" class="debug-console">
    <div class="debug-header">
      <h3>🐛 Debug Console</h3>
      <div class="debug-controls">
        <button @click="debug.clearLogs()" class="debug-btn">Clear Logs</button>
        <button @click="exportLogs" class="debug-btn">Export</button>
        <button @click="showDebug = false" class="debug-btn close-btn">×</button>
      </div>
    </div>
    
    <div class="debug-tabs">
      <button 
        @click="activeTab = 'errors'" 
        :class="{ active: activeTab === 'errors' }"
        class="tab-btn"
      >
        Errors ({{ errorLog.length }})
      </button>
      <button 
        @click="activeTab = 'info'" 
        :class="{ active: activeTab === 'info' }"
        class="tab-btn"
      >
        Info ({{ infoLog.length }})
      </button>
    </div>
    
    <div class="debug-content">
      <div v-if="activeTab === 'errors'" class="log-section">
        <div v-if="errorLog.length === 0" class="no-logs">No errors logged</div>
        <div v-for="(entry, index) in errorLog" :key="index" class="log-entry error">
          <div class="log-timestamp">{{ formatTime(entry.timestamp) }}</div>
          <div class="log-component">{{ entry.context.component }}.{{ entry.context.method || 'unknown' }}</div>
          <div class="log-message">{{ entry.error.message }}</div>
          <details v-if="entry.error.stack" class="log-details">
            <summary>Stack Trace</summary>
            <pre>{{ entry.error.stack }}</pre>
          </details>
          <details v-if="entry.context.data" class="log-details">
            <summary>Context Data</summary>
            <pre>{{ JSON.stringify(entry.context.data, null, 2) }}</pre>
          </details>
        </div>
      </div>
      
      <div v-if="activeTab === 'info'" class="log-section">
        <div v-if="infoLog.length === 0" class="no-logs">No info logs</div>
        <div v-for="(entry, index) in infoLog" :key="index" class="log-entry info">
          <div class="log-timestamp">{{ formatTime(entry.timestamp) }}</div>
          <div class="log-component">{{ entry.context.component }}.{{ entry.context.method || 'unknown' }}</div>
          <div class="log-message">{{ entry.message }}</div>
          <details v-if="entry.context.data" class="log-details">
            <summary>Data</summary>
            <pre>{{ JSON.stringify(entry.context.data, null, 2) }}</pre>
          </details>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Debug Toggle Button -->
  <button 
    v-if="!showDebug && (errorLog.length > 0 || infoLog.length > 0)" 
    @click="showDebug = true" 
    class="debug-toggle"
    :class="{ 'has-errors': errorLog.length > 0 }"
  >
    🐛 Debug ({{ errorLog.length + infoLog.length }})
  </button>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { debug } from '../utils/debug';

const showDebug = ref(false);
const activeTab = ref<'errors' | 'info'>('errors');

const errorLog = computed(() => debug.getErrorLog().slice(-50)); // Show last 50 errors
const infoLog = computed(() => debug.getInfoLog().slice(-50)); // Show last 50 info logs

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString();
}

function exportLogs(): void {
  const logs = debug.exportLogs();
  const blob = new Blob([logs], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ailumni-debug-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Keyboard shortcut to toggle debug console (Ctrl+Shift+D)
function handleKeydown(event: KeyboardEvent): void {
  if (event.ctrlKey && event.shiftKey && event.key === 'D') {
    event.preventDefault();
    showDebug.value = !showDebug.value;
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
  
  // Show debug console automatically if there are errors in dev mode
  if (import.meta.env.DEV && errorLog.value.length > 0) {
    showDebug.value = true;
  }
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.debug-console {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 600px;
  max-width: 90vw;
  height: 400px;
  background: rgba(0, 0, 0, 0.95);
  border: 1px solid #333;
  border-radius: 8px;
  color: #fff;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #333;
  background: #1a1a1a;
}

.debug-header h3 {
  margin: 0;
  font-size: 14px;
}

.debug-controls {
  display: flex;
  gap: 5px;
}

.debug-btn {
  background: #333;
  color: #fff;
  border: 1px solid #555;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
}

.debug-btn:hover {
  background: #444;
}

.close-btn {
  background: #d32f2f !important;
  padding: 4px 10px;
}

.debug-tabs {
  display: flex;
  background: #222;
}

.tab-btn {
  background: transparent;
  color: #aaa;
  border: none;
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  font-size: 11px;
}

.tab-btn.active {
  color: #fff;
  border-bottom-color: #007bff;
}

.debug-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.log-section {
  height: 100%;
}

.no-logs {
  color: #666;
  text-align: center;
  padding: 20px;
  font-style: italic;
}

.log-entry {
  margin-bottom: 10px;
  padding: 8px;
  border-radius: 4px;
  border-left: 3px solid;
}

.log-entry.error {
  background: rgba(211, 47, 47, 0.1);
  border-left-color: #d32f2f;
}

.log-entry.info {
  background: rgba(0, 123, 255, 0.1);
  border-left-color: #007bff;
}

.log-timestamp {
  color: #888;
  font-size: 10px;
  margin-bottom: 2px;
}

.log-component {
  color: #4fc3f7;
  font-weight: bold;
  font-size: 11px;
  margin-bottom: 2px;
}

.log-message {
  color: #fff;
  margin-bottom: 5px;
}

.log-details {
  margin-top: 5px;
}

.log-details summary {
  color: #aaa;
  cursor: pointer;
  font-size: 10px;
  margin-bottom: 5px;
}

.log-details pre {
  background: rgba(255, 255, 255, 0.05);
  padding: 5px;
  border-radius: 2px;
  font-size: 10px;
  overflow-x: auto;
  margin: 0;
}

.debug-toggle {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #333;
  color: #fff;
  border: 1px solid #555;
  padding: 10px 15px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 12px;
  z-index: 9999;
  transition: all 0.3s ease;
}

.debug-toggle:hover {
  background: #444;
}

.debug-toggle.has-errors {
  background: #d32f2f;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(211, 47, 47, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(211, 47, 47, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(211, 47, 47, 0);
  }
}

@media (max-width: 768px) {
  .debug-console {
    width: 95vw;
    height: 60vh;
    top: 10px;
    right: 2.5vw;
  }
}
</style>
