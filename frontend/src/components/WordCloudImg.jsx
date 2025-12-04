export default function WordCloudImg({words}){

  return (
    <div className="bg-white p-6 shadow-xl rounded-xl">
      <h3 className="font-bold mb-4">Word Cloud</h3>
      <div className="flex flex-wrap gap-3">
        {words.map((w,i)=>(
          <span key={i}
            className="text-indigo-600 font-bold"
            style={{fontSize: 10 + w.value}}>
            {w.text}
          </span>
        ))}
      </div>
    </div>
  )
}
