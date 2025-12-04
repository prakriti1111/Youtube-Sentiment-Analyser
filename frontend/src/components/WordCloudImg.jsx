export default function WordCloudImg({words}){

  return (
    <div className="bg-[radial-gradient(circle_at_top_left,#fff3c4,#d2b48c,#bfa079)] p-6 shadow-xl rounded-xl">
      <h3 className="font-bold mb-4">Word Cloud</h3>
      <div className="flex flex-wrap gap-3">
        {words.map((w,i)=>(
          <span key={i}
            className="text-amber-950 font-bold"
            style={{fontSize: 10 + w.value}}>
            {w.text}
          </span>
        ))}
      </div>
    </div>
  )
}
