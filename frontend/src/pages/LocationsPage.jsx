import React, { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useAuthStore } from '../store/authStore'

export default function LocationsPage() {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'

  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [actionError, setActionError] = useState('')

  const loadLocations = async () => {
    try {
      const res = await api.get('/api/locations')
      setLocations(res.locations || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadLocations() }, [])

  const handleAdd = async () => {
    if (!newName.trim()) return
    setAdding(true)
    setActionError('')
    try {
      await api.post('/api/locations', { name: newName.trim() })
      setNewName('')
      await loadLocations()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setAdding(false)
    }
  }

  const handleEdit = async (id) => {
    if (!editName.trim()) return
    setActionError('')
    try {
      await api.put(`/api/locations/${id}`, { name: editName.trim() })
      setEditId(null)
      setEditName('')
      await loadLocations()
    } catch (err) {
      setActionError(err.message)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete location "${name}"?`)) return
    setActionError('')
    try {
      await api.delete(`/api/locations/${id}`)
      await loadLocations()
    } catch (err) {
      setActionError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg className="animate-spin h-8 w-8 text-sage-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-gray-100">Locations</h2>
        <p className="text-sm text-gray-500 mt-0.5">Manage rooms and sections in your facility</p>
      </div>

      {error && (
        <div className="card border-red-800 bg-red-900/20 text-red-400 text-sm">{error}</div>
      )}

      {isAdmin && (
        <div className="card space-y-3">
          <h3 className="font-semibold text-gray-100">Add Location</h3>
          {actionError && (
            <div className="bg-red-900/30 border border-red-700 text-red-400 text-sm px-3 py-2 rounded-lg">
              {actionError}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              className="input-field flex-1"
              placeholder="e.g. Veg Room A, Flower Room B..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <button onClick={handleAdd} disabled={adding} className="btn-primary px-5">
              {adding ? '...' : 'Add'}
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="font-semibold text-gray-100 mb-4">All Locations ({locations.length})</h3>

        {locations.length === 0 ? (
          <p className="text-gray-500 text-sm py-4 text-center">No locations configured yet</p>
        ) : (
          <div className="space-y-2">
            {locations.map((loc) => (
              <div key={loc.id} className="flex items-center justify-between bg-charcoal-700 rounded-xl px-4 py-3">
                {editId === loc.id ? (
                  <div className="flex gap-2 flex-1">
                    <input
                      type="text"
                      className="input-field flex-1 py-2"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleEdit(loc.id)
                        if (e.key === 'Escape') { setEditId(null); setEditName('') }
                      }}
                      autoFocus
                    />
                    <button onClick={() => handleEdit(loc.id)} className="btn-primary py-2 px-4 text-sm">Save</button>
                    <button onClick={() => { setEditId(null); setEditName('') }} className="btn-secondary py-2 px-3 text-sm">✕</button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-sage-500" />
                      <span className="text-gray-200 font-medium">{loc.name}</span>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setEditId(loc.id); setEditName(loc.name) }}
                          className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1 rounded-lg hover:bg-charcoal-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(loc.id, loc.name)}
                          className="text-xs text-red-500 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-red-900/20"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
