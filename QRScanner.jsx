import { useEffect, useRef, useState } from 'react'

export default function QRScanner({ onScan, initialToken = '' }) {
  const [scanning, setScanning] = useState(false)
  const [msg, setMsg] = useState('')
  const [status, setStatus] = useState('idle')
  const [cameraList, setCameraList] = useState([])
  const [selectedCameraId, setSelectedCameraId] = useState('')
  const [manualTokenInput, setManualTokenInput] = useState(initialToken)
  const [submittingToken, setSubmittingToken] = useState(false)
  const html5QrRef = useRef(null)
  const onScanRef = useRef(onScan)
  const REGION_ID = 'qr-region'

  useEffect(() => {
    if (initialToken) {
      setManualTokenInput(initialToken)
    }
  }, [initialToken])

  const parseToken = (text) => {
    if (!text) return ''
    try {
      const u = new URL(text)
      if (u.pathname.includes('/scan/')) {
        const segments = u.pathname.split('/')
        const last = segments[segments.length - 1]
        if (last) return last
      }
      return u.searchParams.get('token') || text
    } catch {
      return text
    }
  }

  const handleManualSubmit = async (e) => {
    e.preventDefault()
    if (!manualTokenInput.trim()) {
      setStatus('error')
      setMsg('Please enter a valid token.')
      return
    }

    setSubmittingToken(true)
    setStatus('active')
    setMsg('Submitting manual token...')

    try {
      await stop()
      const result = await onScanRef.current(manualTokenInput.trim())
      setStatus('success')
      setMsg(result?.message || '✅ Attendance marked successfully!')
    } catch (err) {
      setStatus('error')
      setMsg(err?.response?.data?.message || err?.message || '❌ Failed to mark attendance with this token.')
    } finally {
      setSubmittingToken(false)
    }
  }

  useEffect(() => {
    onScanRef.current = onScan
  }, [onScan])

  const stop = async () => {
    try {
      if (html5QrRef.current?.isScanning) await html5QrRef.current.stop()
    } catch {}
    setScanning(false)
    setStatus('idle')
  }

  const start = async () => {
    setMsg('')
    setStatus('active')

    if (typeof window !== 'undefined' && window.isSecureContext === false && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
      setStatus('error')
      setMsg('Open this website using HTTPS or localhost to allow camera scanning.')
      return
    }

    try {
      await stop()

      const { Html5Qrcode } = await import('html5-qrcode')
      html5QrRef.current = new Html5Qrcode(REGION_ID)

      const cameras = await Html5Qrcode.getCameras().catch(() => [])
      setCameraList(cameras)

      const rearCamera = cameras.find((camera) => /back|rear|environment/i.test(camera.label || ''))
      const preferredCamera = rearCamera || cameras[0]
      const initialCameraId = preferredCamera?.id || ''
      setSelectedCameraId(initialCameraId)

      const cameraConfig = initialCameraId
        ? { deviceId: { exact: initialCameraId } }
        : { facingMode: 'environment' }

      await html5QrRef.current.start(
        cameraConfig,
        { fps: 10, qrbox: { width: 260, height: 260 } },
        async (text) => {
          await stop()
          const token = parseToken(text)
          try {
            const result = await onScanRef.current(token)
            setStatus('success')
            setMsg(result?.message || '✅ Attendance marked successfully!')
          } catch (e) {
            setStatus('error')
            setMsg(e?.response?.data?.message || '❌ Failed. Please try again.')
          }
        },
        () => {}
      )
      setScanning(true)
      setMsg('Camera is live. Point it at the QR code.')
    } catch (e) {
      console.error("QR Scanner Start Error:", e)
      setStatus('error')
      setMsg('Camera access denied or no usable camera was found. Please allow camera permissions and try again.')
    }
  }

  const switchCamera = async () => {
    if (!cameraList.length) return

    const currentIndex = cameraList.findIndex((camera) => camera.id === selectedCameraId)
    const nextIndex = (currentIndex + 1) % cameraList.length
    const nextCamera = cameraList[nextIndex]
    setSelectedCameraId(nextCamera.id)

    try {
      await stop()
      const { Html5Qrcode } = await import('html5-qrcode')
      html5QrRef.current = new Html5Qrcode(REGION_ID)
      await html5QrRef.current.start(
        { deviceId: { exact: nextCamera.id } },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (text) => {
          await stop()
          const token = parseToken(text)
          try {
            const result = await onScanRef.current(token)
            setStatus('success')
            setMsg(result?.message || '✅ Attendance marked successfully!')
          } catch (e) {
            setStatus('error')
            setMsg(e?.response?.data?.message || '❌ Failed. Please try again.')
          }
        },
        () => {}
      )
      setScanning(true)
      setMsg(`Using ${nextCamera.label || 'camera'}. Point it at the QR code.`)
    } catch (e) {
      console.error("QR Scanner Camera Switch Error:", e)
      setStatus('error')
      setMsg('Unable to switch camera. Please try again.')
    }
  }

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      if (cancelled) return
      await start()
    }

    init()

    return () => {
      cancelled = true
      stop()
    }
  }, [])

  return (
    <div className="qr-scanner-wrap">
      <div id={REGION_ID} className="qr-region" />
      {!scanning && (
        <div className="qr-placeholder">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/>
            <path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
            <line x1="7" y1="12" x2="17" y2="12"/>
          </svg>
          <p>Camera is starting automatically...</p>
        </div>
      )}
      {msg && <div className={`scanner-msg ${status}`}>{msg}</div>}
      <div className="scanner-btns">
        {!scanning
          ? <button className="btn btn-primary" onClick={start}>📷 Try Again</button>
          : <button className="btn btn-danger" onClick={stop}>⏹ Stop Scanner</button>
        }
        {cameraList.length > 1 && (
          <button className="btn btn-secondary" onClick={switchCamera}>🔄 Switch Camera</button>
        )}
        {status === 'success' && (
          <button className="btn btn-secondary" onClick={() => { setStatus('idle'); setMsg(''); start() }}>
            🔄 Scan Again
          </button>
        )}
      </div>

      {/* Manual Token Entry inside the QR scanner */}
      <form onSubmit={handleManualSubmit} style={{ width: '100%', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>
          Or enter the token manually
        </label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
          <input
            type="text"
            className="form-input"
            value={manualTokenInput}
            onChange={(e) => setManualTokenInput(e.target.value)}
            placeholder="Paste or type teacher's token here"
            style={{ flex: 1, margin: 0, padding: '10px 14px' }}
          />
          <button 
            className="btn btn-primary" 
            type="submit" 
            disabled={submittingToken || !manualTokenInput.trim()}
            style={{ padding: '0 20px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {submittingToken ? 'Submitting...' : 'Submit Token'}
          </button>
        </div>
      </form>
    </div>
  )
}   