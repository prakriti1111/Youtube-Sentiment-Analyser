import { useState } from "react";

export default function InputForm({ setInsights,setLoading,setError }) {

  const [url,setUrl]=useState("");
  const [keyword,setKeyword]=useState("");
  const [maxComments,setMax]=useState(500);

  const submit = async (e)=>{
    e.preventDefault();
    setLoading(true); setError("");

    try{
      const res = await fetch('http://127.0.0.1:5000/analyze',{
        method:"POST",
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({url,keyword,maxComments})
      });

      const data = await res.json();
      if(data.error) throw new Error(data.error);

      setInsights(data.insights)
    }
    catch(e){
      setError(e.message)
    }
    finally{ setLoading(false) }
  }

  return (
    <form onSubmit={submit} className="max-w-4xl mx-auto mt-10 bg-white p-6 rounded-xl shadow-xl grid md:grid-cols-3 gap-4">

      <input required placeholder="YouTube URL" 
      className="p-3 rounded border" 
      onChange={e=>setUrl(e.target.value)}/>

      <input placeholder="Keyword" 
      className="p-3 rounded border" 
      onChange={e=>setKeyword(e.target.value)}/>

      <input type="number" value={maxComments} 
      className="p-3 rounded border" 
      onChange={e=>setMax(e.target.value)}/>

      <button className="md:col-span-3 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
        Analyze Comments 🚀
      </button>

    </form>
  )
}
