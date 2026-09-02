'use client'

export function DraftModeBanner() {
  const handleDisable = async () => {
    await fetch('/next/exit-preview')
    window.location.reload()
  }

  return (
    <div className="fixed bottom-4 left-4 z-[200] animate-in slide-in-from-bottom-4 duration-300 group">
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white pl-3.5 pr-3.5 group-hover:pr-3.5 py-2 rounded-full shadow-2xl flex items-center gap-0 group-hover:gap-3 border border-amber-400/30 backdrop-blur-sm transition-all duration-300">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          <span className="text-xs font-medium">Draft Mode is active</span>
        </div>
        <button
          onClick={handleDisable}
          className="text-[11px] bg-white text-amber-600 px-3 py-1 rounded-full hover:bg-amber-50 transition-all font-semibold shadow-sm hover:shadow-md overflow-hidden max-w-0 opacity-0 group-hover:max-w-[100px] group-hover:opacity-100 group-hover:ml-0 -ml-3 duration-300 ease-in-out whitespace-nowrap"
        >
          Disable
        </button>
      </div>
    </div>
  )
}
