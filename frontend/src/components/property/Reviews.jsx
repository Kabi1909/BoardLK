import {useState} from 'react';
import {Star} from 'lucide-react';
import {Avatar,RatingStars} from '../common/UI';
import {FormTextarea} from '../forms/Fields';
import {useAuth} from '../../context/AuthContext';
import {addReview} from '../../services/actions';
import {date} from '../../utils/format';
export function ReviewForm({property}){const {user}=useAuth();const [rating,setRating]=useState(5);const [comment,setComment]=useState('');const [error,setError]=useState('');const [done,setDone]=useState(false);return done?<div className="success">Thank you! Your review has been published.</div>:<form className="review-form" onSubmit={e=>{e.preventDefault();if(comment.trim().length<10){setError('Write at least 10 characters.');return;}try{addReview(user,property,rating,comment);setDone(true);}catch(e){setError(e.message);}}}><h3>Share your experience</h3><div className="review-stars" role="group" aria-label="Choose rating">{[1,2,3,4,5].map(n=><button type="button" key={n} aria-label={n+' stars'} aria-pressed={rating===n} onClick={()=>setRating(n)}><Star fill={n<=rating?'#d9a543':'none'} color="#d9a543"/></button>)}</div><FormTextarea label="Your review" value={comment} onChange={e=>setComment(e.target.value)} required error={error}/><button className="btn small">Publish review</button></form>;}
export function ReviewCard({review,user}){return <article className="review-card"><div className="section-heading"><div className="person"><Avatar user={user}/><div><strong>{user?.name||'Former renter'}</strong><small>{date(review.createdAt)}</small></div></div><RatingStars rating={review.rating}/></div><p>{review.comment}</p>{review.reply&&<div className="owner-reply"><b>Owner’s response</b><p>{review.reply}</p></div>}</article>;}
