export async function movePlants(labels, location) {
  return fetch('/api/movePlants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ labels, location }),
  })
}

export async function submitBiowaste(data) {
  return fetch('/api/biowaste', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function getWhere() {
  return fetch('/api/where').then(r => r.json())
}