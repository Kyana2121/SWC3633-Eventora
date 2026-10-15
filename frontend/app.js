/* Eventora frontend. Demo mode uses sample records; live mode calls the supplied PHP REST API. */
const API_BASE = "../api";
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const state = { role:null, user:null, mode:"demo", page:"overview", search:"", filter:"all", category:"All events", data:{users:[],events:[],venues:[],schedules:[],bookings:[]}, token:null };
const demo = {
 users:[
  {user_id:1,full_name:"Kya Satina",email:"kya.admin@example.com",role:"admin",created_at:"2026-09-12"},
  {user_id:2,full_name:"Aina Rahman",email:"aina.organiser@example.com",role:"organiser",created_at:"2026-09-13"},
  {user_id:3,full_name:"Daniel Lim",email:"daniel@example.com",role:"customer",created_at:"2026-09-15"},
  {user_id:4,full_name:"Sofia Tan",email:"sofia@example.com",role:"customer",created_at:"2026-09-18"}
 ],
 venues:[
  {venue_id:1,venue_name:"The Glass Hall",location:"Kuala Lumpur",capacity:500,description:"A bright modern event space."},
  {venue_id:2,venue_name:"Ruang Seni",location:"Petaling Jaya",capacity:180,description:"Creative workshops and community events."},
  {venue_id:3,venue_name:"Skyline Studio",location:"Kuala Lumpur",capacity:120,description:"An intimate studio venue."}
 ],
 events:[
  {event_id:1,organiser_id:2,venue_id:1,title:"The Rose Sessions",description:"An intimate evening of live music and local artists.",category:"Music",status:"published",created_at:"2026-09-15"},
  {event_id:2,organiser_id:2,venue_id:2,title:"Create & Connect",description:"A hands-on creative workshop for curious minds.",category:"Workshop",status:"published",created_at:"2026-09-18"},
  {event_id:3,organiser_id:2,venue_id:3,title:"Founders After Hours",description:"A relaxed networking evening for builders.",category:"Networking",status:"draft",created_at:"2026-09-20"},
  {event_id:4,organiser_id:2,venue_id:1,title:"Sunday Market Stories",description:"Meet independent makers, designers and small brands.",category:"Community",status:"published",created_at:"2026-09-22"}
 ],
 schedules:[
  {schedule_id:1,event_id:1,start_time:"2026-11-06 19:30:00",end_time:"2026-11-06 22:00:00",total_tickets:200,available_tickets:143,ticket_price:75},
  {schedule_id:2,event_id:2,start_time:"2026-11-14 10:00:00",end_time:"2026-11-14 13:00:00",total_tickets:80,available_tickets:42,ticket_price:45},
  {schedule_id:3,event_id:3,start_time:"2026-11-21 18:30:00",end_time:"2026-11-21 21:00:00",total_tickets:100,available_tickets:100,ticket_price:30},
  {schedule_id:4,event_id:4,start_time:"2026-11-29 11:00:00",end_time:"2026-11-29 16:00:00",total_tickets:150,available_tickets:67,ticket_price:15}
 ],
 bookings:[
  {booking_id:1,user_id:3,schedule_id:1,quantity:2,total_price:150,booking_status:"confirmed",booked_at:"2026-10-01 13:20:00"},
  {booking_id:2,user_id:4,schedule_id:2,quantity:1,total_price:45,booking_status:"confirmed",booked_at:"2026-10-03 10:10:00"},
  {booking_id:3,user_id:3,schedule_id:4,quantity:3,total_price:45,booking_status:"confirmed",booked_at:"2026-10-04 16:45:00"},
  {booking_id:4,user_id:4,schedule_id:3,quantity:1,total_price:30,booking_status:"cancelled",booked_at:"2026-10-05 09:00:00"}
 ]
};
const menus = {
 admin:[["overview","Overview","▦"],["users","Manage users","♙"],["events","Manage events","✦"],["venues","Manage venues","⌂"],["schedules","Ticket schedules","◷"],["bookings","Manage bookings","▤"]],
 organiser:[["overview","Overview","▦"],["events","My events","✦"],["schedules","Ticket schedules","◷"],["bookings","Bookings","▤"]],
 customer:[["overview","Discover events","✦"],["mybookings","My bookings","▤"],["profile","My profile","♙"]]
};
const roleLabel = r => ({admin:"Administrator",organiser:"Organiser",customer:"Customer"}[r]||r);
const esc = v => String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money = n => "RM "+Number(n||0).toFixed(2);
const dateShort = v => { if(!v)return "—"; const d=new Date(String(v).replace(" ","T")); return Number.isNaN(+d)?esc(v):d.toLocaleDateString("en-MY",{day:"numeric",month:"short",year:"numeric"}); };
const eventFor = id => state.data.events.find(x=>Number(x.event_id)===Number(id));
const venueFor = id => state.data.venues.find(x=>Number(x.venue_id)===Number(id));
const userFor = id => state.data.users.find(x=>Number(x.user_id)===Number(id));
const scheduleFor = id => state.data.schedules.find(x=>Number(x.schedule_id)===Number(id));
const statusPill = status => `<span class="pill ${esc(String(status||"pending").toLowerCase())}">${esc(status||"Pending")}</span>`;
function toast(message){const el=$("#toast");el.textContent=message;el.classList.remove("hidden");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.add("hidden"),3400)}
function setMessage(msg,success=false){const el=$("#login-message");el.textContent=msg;el.classList.remove("hidden");el.classList.toggle("success",success)}
function resetMessage(){$("#login-message").classList.add("hidden")}
function seedDemo(){state.data=JSON.parse(JSON.stringify(demo))}
function enterApp(role,user,mode="demo",token=null){
 state.role=role;state.user=user;state.mode=mode;state.token=token;state.page=role==="customer"?"overview":"overview";state.search="";state.filter="all";
 $("#login-screen").classList.add("hidden");$("#app-shell").classList.remove("hidden");
 $("#profile-name").textContent=user.full_name||"Eventora user";$("#profile-role").textContent=roleLabel(role);$("#avatar").textContent=(user.full_name||"EU").split(/\s+/).map(x=>x[0]).slice(0,2).join("").toUpperCase();
 $("#today-label").textContent=new Date().toLocaleDateString("en-MY",{weekday:"short",day:"numeric",month:"short"});
 renderNav();renderPage();
}
function renderNav(){
 $("#main-nav").innerHTML=menus[state.role].map(([id,label,icon])=>`<button class="nav-item ${state.page===id?"active":""}" data-page="${id}"><span class="nav-icon">${icon}</span><span>${label}</span>${id==="bookings"&&state.role==="admin"?`<span class="nav-count">${state.data.bookings.length}</span>`:""}</button>`).join("");
 $$("#main-nav [data-page]").forEach(b=>b.addEventListener("click",()=>{state.page=b.dataset.page;state.search="";state.filter="all";$("#sidebar").classList.remove("open");renderNav();renderPage()}));
}
function heading(title,sub,action=""){return `<div class="page-heading"><div><span class="eyebrow">${roleLabel(state.role).toUpperCase()} WORKSPACE</span><h1>${title}</h1><p>${sub}</p></div><div class="heading-actions">${action}</div></div>`}
function stat(label,value,icon,foot){return `<article class="stat-card"><div class="stat-top"><span class="stat-label">${label}</span><span class="stat-icon">${icon}</span></div><div class="stat-value">${value}</div><div class="stat-foot">${foot}</div></article>`}
function eventTableRows(events){
 if(!events.length)return `<tr><td colspan="6"><div class="empty-state"><b>No matching events</b>Try changing the search or add a new event.</div></td></tr>`;
 return events.map(e=>{const v=venueFor(e.venue_id),u=userFor(e.organiser_id);return `<tr><td><strong>${esc(e.title)}</strong><small>#EV-${e.event_id}</small></td><td>${esc(v?.venue_name||"Venue pending")}<small>${esc(v?.location||"")}</small></td><td>${esc(e.category||"General")}</td><td>${state.role==="admin"?esc(u?.full_name||"Organiser"): "Your event"}</td><td>${statusPill(e.status)}</td><td><div class="table-actions"><button class="mini-btn" data-edit="events" data-id="${e.event_id}">Edit</button><button class="mini-btn" data-delete="events" data-id="${e.event_id}">Delete</button></div></td></tr>`}).join("");
}
function recentEventsPanel(events){
 return `<section class="panel"><div class="panel-head"><div><h2>Recent events</h2><p>A quick look at what's happening in your workspace.</p></div><button class="text-link" data-goto="events">View all ↗</button></div><div class="panel-body">${events.slice(0,4).map(e=>{const v=venueFor(e.venue_id);return `<div class="event-row"><div class="event-thumb">${e.category==="Music"?"♫":e.category==="Workshop"?"✎":e.category==="Networking"?"⌘":"✦"}</div><div class="event-info"><b>${esc(e.title)}</b><small>${esc(v?.venue_name||"Venue pending")} · ${dateShort(state.data.schedules.find(s=>s.event_id===e.event_id)?.start_time)}</small></div><div class="event-meta">${statusPill(e.status)}</div></div>`}).join("")||`<div class="empty-state">No events yet.</div>`}</div></section>`;
}
function quickPanel(items){return `<section class="panel"><div class="panel-head"><div><h2>Quick actions</h2><p>Jump into a task and keep things moving.</p></div></div><div class="panel-body"><div class="quick-grid">${items.map(([icon,title,desc,page])=>`<button class="quick-action" data-goto="${page}"><span>${icon}</span><span><b>${title}</b><small>${desc}</small></span></button>`).join("")}</div></div></section>`}
function renderOverview(){
 if(state.role==="admin"){
  const published=state.data.events.filter(e=>e.status==="published").length;
  return heading("Good day, "+esc((state.user.full_name||"Admin").split(" ")[0])+" ✨","Here's what's happening across your event ticketing platform.",`<button class="btn btn-primary" data-modal="events">＋ Create event</button>`) +
  `<div class="stat-grid">${stat("Total users",state.data.users.length,"♙",'<span class="up">●</span> Across all roles')}${stat("Total events",state.data.events.length,"✦",published+" published")}${stat("Venues",state.data.venues.length,"⌂","Available event spaces")}${stat("Bookings",state.data.bookings.length,"▤",state.data.bookings.filter(b=>b.booking_status==="confirmed").length+" confirmed")}</div><div class="content-grid">${recentEventsPanel(state.data.events)}${quickPanel([["♙","Manage users","Accounts and roles","users"],["✦","Manage events","Publish and update","events"],["⌂","Manage venues","Locations and capacity","venues"],["▤","View bookings","Track reservations","bookings"]])}</div>${apiStatus()}`;
 }
 if(state.role==="organiser"){
  const own=state.data.events.filter(e=>Number(e.organiser_id)===Number(state.user.user_id));
  const ids=own.map(e=>Number(e.event_id));const sch=state.data.schedules.filter(s=>ids.includes(Number(s.event_id)));
  const book=state.data.bookings.filter(b=>sch.some(s=>Number(s.schedule_id)===Number(b.schedule_id)));
  return heading("Your events, at a glance","Create experiences and keep every detail on track.",`<button class="btn btn-primary" data-modal="events">＋ Create event</button>`) +
  `<div class="stat-grid">${stat("Your events",own.length,"✦","Events you manage")}${stat("Published",own.filter(e=>e.status==="published").length,"↗","Visible to customers")}${stat("Ticket schedules",sch.length,"◷","Upcoming sessions")}${stat("Confirmed bookings",book.filter(b=>b.booking_status==="confirmed").length,"▤","Across your events")}</div><div class="content-grid">${recentEventsPanel(own)}${quickPanel([["✦","Create an event","Share something special","events"],["◷","Ticket schedules","Price and ticket stock","schedules"],["▤","Bookings","Review reservations","bookings"]])}</div>${apiStatus()}`;
 }
 const published=state.data.events.filter(e=>e.status==="published");
 const my=state.data.bookings.filter(b=>Number(b.user_id)===Number(state.user.user_id));
 return `<div class="customer-hero"><div><span class="eyebrow">A LITTLE SOMETHING TO LOOK FORWARD TO</span><h2>Find your next favourite moment.</h2><p>Discover events, meet your people, and make plans worth remembering.</p></div><div class="hero-sticker">✿</div></div>${heading("Explore events","A hand-picked starting point for your next experience.",`<button class="btn btn-outline" data-goto="mybookings">My bookings (${my.length})</button>`)}<div class="stat-grid">${stat("Available events",published.length,"✦","Ready to discover")}${stat("Your bookings",my.length,"▤","All booking statuses")}${stat("Confirmed",my.filter(b=>b.booking_status==="confirmed").length,"♡","Your upcoming plans")}${stat("Events nearby",published.filter(e=>venueFor(e.venue_id)?.location==="Kuala Lumpur").length,"⌂","Kuala Lumpur")}</div>${eventCards(published.slice(0,3))}${apiStatus()}`;
}
function apiStatus(){return `<div class="notice"><span class="api-indicator ${state.mode==="live"?"live":"demo"}"><i></i> ${state.mode==="live"?"Connected session":"Preview mode"}</span><br>${state.mode==="live"?"The interface is using live API responses for supported requests. Confirm each operation in the backend before reporting it as tested.":"Showing sample data so you can review the design before the database is available. Changes made in preview mode are temporary and are not saved to the backend."}</div>`}
function tablePage(type,title,sub,fields){
 let data=state.data[type]||[];
 if(state.role==="organiser"&&type==="events")data=data.filter(e=>Number(e.organiser_id)===Number(state.user.user_id));
 if(state.role==="organiser"&&type==="schedules"){const ids=state.data.events.filter(e=>Number(e.organiser_id)===Number(state.user.user_id)).map(e=>Number(e.event_id));data=data.filter(s=>ids.includes(Number(s.event_id)))}
 if(state.role==="organiser"&&type==="bookings"){const ids=state.data.events.filter(e=>Number(e.organiser_id)===Number(state.user.user_id)).map(e=>Number(e.event_id));const sids=state.data.schedules.filter(s=>ids.includes(Number(s.event_id))).map(s=>Number(s.schedule_id));data=data.filter(b=>sids.includes(Number(b.schedule_id)))}
 if(type==="bookings"&&state.role==="customer")data=data.filter(b=>Number(b.user_id)===Number(state.user.user_id));
 const q=state.search.toLowerCase();
 data=data.filter(row=>Object.values(row).some(v=>String(v??"").toLowerCase().includes(q)));
 if(state.filter!=="all")data=data.filter(row=>String(row.status||row.booking_status||row.role||"").toLowerCase()===state.filter);
 let head=heading(title,sub,`<button class="btn btn-primary" data-modal="${type}">＋ Add ${type==="users"?"user":type==="events"?"event":type==="venues"?"venue":type==="schedules"?"schedule":"booking"}</button>`);
 if(state.role==="customer"&&type==="bookings")head=heading(title,sub,`<button class="btn btn-outline" data-goto="overview">Explore events</button>`);
 const filters=type==="users"?["all","admin","organiser","customer"]:type==="events"?["all","published","draft","cancelled"]:type==="bookings"?["all","confirmed","cancelled"]:["all"];
 return head+`<section class="panel"><div class="panel-head"><div><h2>${title}</h2><p>${data.length} record${data.length===1?"":"s"} shown</p></div><div class="table-tools"><input class="search-input" id="table-search" value="${esc(state.search)}" placeholder="Search ${type}..." aria-label="Search records"><select class="filter-select" id="table-filter" aria-label="Filter records">${filters.map(f=>`<option value="${f}" ${state.filter===f?"selected":""}>${f==="all"?"All statuses/roles":f[0].toUpperCase()+f.slice(1)}</option>`).join("")}</select></div></div><div class="table-wrap"><table><thead><tr>${fields.map(f=>`<th>${f[1].toUpperCase()}</th>`).join("")}<th>ACTIONS</th></tr></thead><tbody>${data.length?data.map(row=>`<tr>${fields.map(f=>`<td>${cellValue(type,row,f[0])}</td>`).join("")}<td><div class="table-actions">${type==="events"||type==="venues"||type==="users"||type==="schedules"?`<button class="mini-btn" data-edit="${type}" data-id="${row[primaryKey(type)]}">Edit</button>`:""}${type==="bookings"&&state.role==="customer"&&row.booking_status==="confirmed"?`<button class="mini-btn" data-cancel-booking="${row.booking_id}">Cancel</button>`:""}${["users","events","venues","schedules"].includes(type)&&state.role!=="customer"?`<button class="mini-btn" data-delete="${type}" data-id="${row[primaryKey(type)]}">Delete</button>`:""}</div></td></tr>`).join(""):`<tr><td colspan="${fields.length+1}"><div class="empty-state"><b>No records found</b>Try another search or add a record.</div></td></tr>`}</tbody></table></div></section>${apiStatus()}`;
}
function primaryKey(t){return {users:"user_id",events:"event_id",venues:"venue_id",schedules:"schedule_id",bookings:"booking_id"}[t]}
function cellValue(type,row,key){
 if(key==="role")return `<span class="pill ${esc(row.role)}">${esc(roleLabel(row.role))}</span>`;
 if(key==="status"||key==="booking_status")return statusPill(row[key]);
 if(key==="full_name")return `<strong>${esc(row.full_name)}</strong><small>${esc(row.email)}</small>`;
 if(key==="title")return `<strong>${esc(row.title)}</strong><small>#EV-${row.event_id}</small>`;
 if(key==="event_id"){const e=eventFor(row.event_id);return esc(e?.title||("#"+row.event_id))}
 if(key==="venue_id"){const v=venueFor(row.venue_id);return esc(v?.venue_name||("#"+row.venue_id))}
 if(key==="organiser_id"){return esc(userFor(row.organiser_id)?.full_name||("#"+row.organiser_id))}
 if(key==="schedule_id"){const s=scheduleFor(row.schedule_id);return esc(eventFor(s?.event_id)?.title||("#"+row.schedule_id))}
 if(key==="user_id")return esc(userFor(row.user_id)?.full_name||("#"+row.user_id));
 if(key==="start_time")return `${dateShort(row.start_time)}<small>${esc(String(row.start_time||"").split(" ")[1]?.slice(0,5)||"")}</small>`;
 if(key==="booked_at"||key==="created_at")return dateShort(row[key]);
 if(key==="ticket_price"||key==="total_price")return `<strong>${money(row[key])}</strong>`;
 if(key==="quantity")return esc(row.quantity)+" ticket(s)";
 if(key==="description")return esc(row.description||"—");
 return esc(row[key]??"—");
}
function eventCards(events){
 if(!events.length)return `<div class="panel"><div class="empty-state"><b>No published events yet</b>Please check again later.</div></div>`;
 return `<div class="event-cards">${events.map((e,i)=>{const v=venueFor(e.venue_id),s=state.data.schedules.find(x=>Number(x.event_id)===Number(e.event_id));return `<article class="event-card"><div class="event-card-art art-${i%4+1}"><span class="pill published">${esc(e.category||"Event")}</span><span class="art-symbol">${["♫","✿","✧","✦"][i%4]}</span></div><div class="event-card-content"><span class="eyebrow">${dateShort(s?.start_time||e.created_at)}</span><h3>${esc(e.title)}</h3><p>${esc(e.description||"Discover something new and meet your community.")}</p><div class="event-card-meta"><span>⌂ ${esc(v?.location||"Location TBC")}</span><b>${s?money(s.ticket_price):"Price TBC"}</b></div><button class="btn btn-primary btn-wide" style="margin-top:14px" data-book-event="${e.event_id}">View & book tickets →</button></div></article>`}).join("")}</div>`;
}
function renderCustomerDiscover(){
 let events=state.data.events.filter(e=>e.status==="published");
 if(state.category!=="All events")events=events.filter(e=>e.category===state.category);
 if(state.search)events=events.filter(e=>(e.title+" "+e.description+" "+e.category).toLowerCase().includes(state.search.toLowerCase()));
 const categories=["All events",...new Set(state.data.events.filter(e=>e.status==="published").map(e=>e.category).filter(Boolean))];
 return heading("Discover events","Your next story starts with a plan.",`<div class="table-tools"><input class="search-input" id="discover-search" value="${esc(state.search)}" placeholder="Search events..." aria-label="Search events"></div>`)+`<div class="category-chips">${categories.map(c=>`<button class="category-chip ${state.category===c?"active":""}" data-category="${esc(c)}">${esc(c)}</button>`).join("")}</div>${eventCards(events)}${apiStatus()}`;
}
function renderPage(){
 const content=$("#page-content");let html="";
 if(state.role==="customer"&&state.page==="overview")html=renderOverview();
 else if(state.role==="customer"&&state.page==="mybookings")html=tablePage("bookings","My bookings","Review your ticket reservations.",[["booking_id","Booking ID"],["schedule_id","Event"],["quantity","Tickets"],["total_price","Total"],["booking_status","Status"],["booked_at","Booked on"]]);
 else if(state.role==="customer"&&state.page==="profile")html=heading("My profile","Your account details at a glance.")+`<section class="panel"><div class="panel-head"><h2>Account information</h2></div><div class="panel-body"><div class="field-grid"><label class="field">Full name<input value="${esc(state.user.full_name)}" readonly></label><label class="field">Email address<input value="${esc(state.user.email)}" readonly></label><label class="field">Role<input value="${roleLabel(state.role)}" readonly></label></div><p class="muted">Profile editing is not included in the supplied user API for non-admin accounts beyond the fields supported by the backend.</p></div></section>`;
 else if(state.role==="customer"&&state.page==="overview")html=renderOverview();
 else if(state.role==="customer"&&state.page==="discover")html=renderCustomerDiscover();
 else if(state.page==="overview")html=renderOverview();
 else if(state.page==="users")html=tablePage("users","Manage users","Manage accounts and role assignments.",[["full_name","User"],["role","Role"],["created_at","Joined"]]);
 else if(state.page==="events")html=tablePage("events",state.role==="organiser"?"My events":"Manage events","Create, update and review event information.",[["title","Event"],["venue_id","Venue"],["category","Category"],["organiser_id","Organiser"],["status","Status"]]);
 else if(state.page==="venues")html=tablePage("venues","Manage venues","Maintain event spaces and their capacities.",[["venue_name","Venue"],["location","Location"],["capacity","Capacity"],["description","Description"]]);
 else if(state.page==="schedules")html=tablePage("schedules","Ticket schedules","Manage session times, ticket stock and prices.",[["event_id","Event"],["start_time","Starts"],["end_time","Ends"],["total_tickets","Total tickets"],["available_tickets","Available"],["ticket_price","Price"]]);
 else if(state.page==="bookings")html=tablePage("bookings",state.role==="organiser"?"Bookings for your events":"Manage bookings","Review ticket quantities, totals and booking status.",[["booking_id","Booking"],["user_id","Customer"],["schedule_id","Event"],["quantity","Tickets"],["total_price","Total"],["booking_status","Status"]]);
 else html=renderCustomerDiscover();
 content.innerHTML=html;bindPageActions();
}
function bindPageActions(){
 $$("[data-goto]").forEach(b=>b.addEventListener("click",()=>{state.page=b.dataset.goto;renderNav();renderPage()}));
 $$("[data-modal]").forEach(b=>b.addEventListener("click",()=>openForm(b.dataset.modal)));
 $$("[data-edit]").forEach(b=>b.addEventListener("click",()=>openForm(b.dataset.edit,Number(b.dataset.id))));
 $$("[data-delete]").forEach(b=>b.addEventListener("click",()=>deleteRecord(b.dataset.delete,Number(b.dataset.id))));
 $$("[data-book-event]").forEach(b=>b.addEventListener("click",()=>openBooking(Number(b.dataset.bookEvent))));
 $$("[data-cancel-booking]").forEach(b=>b.addEventListener("click",()=>cancelBooking(Number(b.dataset.cancelBooking))));
 $$("[data-category]").forEach(b=>b.addEventListener("click",()=>{state.category=b.dataset.category;renderPage()}));
 const search=$("#table-search");if(search)search.addEventListener("input",e=>{const pos=e.target.selectionStart;state.search=e.target.value;renderPage();const el=$("#table-search");el.focus();el.setSelectionRange(pos,pos)});
 const filter=$("#table-filter");if(filter)filter.addEventListener("change",e=>{state.filter=e.target.value;renderPage()});
 const ds=$("#discover-search");if(ds)ds.addEventListener("input",e=>{state.search=e.target.value;const pos=e.target.selectionStart;renderPage();const el=$("#discover-search");el.focus();el.setSelectionRange(pos,pos)});
}
function openForm(type,id=null){
 if(type==="bookings"&&state.role==="customer"){toast("To create a booking, choose an event and select a ticket schedule.");return}
 if(type==="bookings"&&state.role!=="admin"&&state.role!=="organiser"){toast("You do not have permission to create bookings.");return}
 const rows=state.data[type]||[],record=id?rows.find(r=>Number(r[primaryKey(type)])===id):{};
 const isEdit=!!record&&!!id;let title=(isEdit?"Edit ":"Add ")+({users:"user",events:"event",venues:"venue",schedules:"ticket schedule",bookings:"booking"}[type]||type);
 let fields=[];
 if(type==="users")fields=[field("full_name","Full name",record.full_name||"","text",true),field("email","Email address",record.email||"","email",true),selectField("role","Role",["admin","organiser","customer"],record.role||"customer")];
 if(type==="events")fields=[field("title","Event title",record.title||"","text",true),selectDataField("venue_id","Venue",state.data.venues,"venue_id","venue_name",record.venue_id),selectField("category","Category",["Music","Workshop","Networking","Community","Sports","Other"],record.category||"Music"),selectField("status","Status",["draft","published","cancelled"],record.status||"draft"),field("description","Description",record.description||"","textarea",false,true)];
 if(type==="venues")fields=[field("venue_name","Venue name",record.venue_name||"","text",true),field("location","Location",record.location||"","text",true),field("capacity","Capacity",record.capacity??"","number",true),field("description","Description",record.description||"","textarea",false,true)];
 if(type==="schedules")fields=[selectDataField("event_id","Event",state.data.events.filter(e=>state.role!=="organiser"||Number(e.organiser_id)===Number(state.user.user_id)),"event_id","title",record.event_id),field("start_time","Start time (YYYY-MM-DD HH:MM:SS)",record.start_time||"","text",true),field("end_time","End time (YYYY-MM-DD HH:MM:SS)",record.end_time||"","text",true),field("total_tickets","Total tickets",record.total_tickets??"","number",true),field("available_tickets","Available tickets",record.available_tickets??"","number",true),field("ticket_price","Ticket price (RM)",record.ticket_price??"","number",true)];
 if(type==="bookings")fields=[selectDataField("user_id","Customer",state.data.users.filter(u=>u.role==="customer"),"user_id","full_name",record.user_id),selectDataField("schedule_id","Schedule",state.data.schedules,"schedule_id","schedule_id",record.schedule_id),field("quantity","Ticket quantity",record.quantity??1,"number",true),selectField("booking_status","Status",["confirmed","cancelled"],record.booking_status||"confirmed")];
 const root=$("#modal-root");root.innerHTML=`<div class="modal-backdrop" data-backdrop><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><h2 id="modal-title">${title}</h2><button class="modal-close" data-close aria-label="Close">×</button></div><form id="record-form"><div class="modal-body"><div class="field-grid">${fields.join("")}</div><p class="muted tiny">Required fields are marked with *. In preview mode, changes remain in this browser session only.</p></div><div class="modal-foot"><button type="button" class="btn btn-outline" data-close>Cancel</button><button type="submit" class="btn btn-primary">${isEdit?"Save changes":"Create record"}</button></div></form></section></div>`;
 $$("[data-close]",root).forEach(b=>b.addEventListener("click",closeModal));$("[data-backdrop]",root).addEventListener("click",e=>{if(e.target===e.currentTarget)closeModal()});
 $("#record-form").addEventListener("submit",async e=>{e.preventDefault();const fd=new FormData(e.currentTarget),payload={};for(const [k,v] of fd.entries())payload[k]=v;
  if(type==="users"&&!isEdit&&!payload.password){payload.password="";} // Backend user creation schema may require additional password handling.
  if(type==="venues"){payload.capacity=Number(payload.capacity);if(payload.capacity<1)return toast("Capacity must be at least 1.");}
  if(type==="schedules"){for(const k of ["event_id","total_tickets","available_tickets"])payload[k]=Number(payload[k]);payload.ticket_price=Number(payload.ticket_price);if(payload.total_tickets<=0||payload.available_tickets<0||payload.available_tickets>payload.total_tickets||payload.ticket_price<0)return toast("Check ticket counts and price.");if(new Date(payload.end_time.replace(" ","T"))<=new Date(payload.start_time.replace(" ","T")))return toast("End time must be after start time.");}
  if(type==="events"&&state.role==="organiser")payload.organiser_id=state.user.user_id;
  if(type==="bookings"){payload.user_id=Number(payload.user_id);payload.schedule_id=Number(payload.schedule_id);payload.quantity=Number(payload.quantity);const s=scheduleFor(payload.schedule_id);payload.total_price=Number(s?.ticket_price||0)*payload.quantity;}
  try{if(state.mode==="live"){await saveLive(type,payload,id);await loadLive();toast("Request sent to API. Verify the returned data before treating it as complete.");}else{saveDemo(type,payload,id);toast(isEdit?"Record updated in preview mode.":"Record added in preview mode.");}closeModal();renderNav();renderPage();}catch(err){toast("Could not save: "+err.message)}
 });
}
function field(name,label,value,type="text",required=false,full=false){return `<label class="field ${full?"full":""}">${label}${required?" *":""}<input name="${name}" type="${type==="textarea"?"text":type}" value="${esc(value)}" ${required?"required":""} ${type==="number"?'min="0" step="any"':""} ${name==="start_time"||name==="end_time"?'placeholder="2026-11-06 19:30:00"':""}></label>`}
function selectField(name,label,options,value){return `<label class="field">${label}<select name="${name}" required>${options.map(o=>`<option value="${esc(o)}" ${String(value)===String(o)?"selected":""}>${esc(o[0].toUpperCase()+o.slice(1))}</option>`).join("")}</select></label>`}
function selectDataField(name,label,rows,valueKey,labelKey,value){return `<label class="field">${label}<select name="${name}" required><option value="">Choose ${label.toLowerCase()}</option>${rows.map(r=>`<option value="${esc(r[valueKey])}" ${String(value)===String(r[valueKey])?"selected":""}>${esc(r[labelKey])}</option>`).join("")}</select></label>`}
function closeModal(){$("#modal-root").innerHTML=""}
function saveDemo(type,payload,id){
 const arr=state.data[type],pk=primaryKey(type);
 if(id){const i=arr.findIndex(x=>Number(x[pk])===id);if(i<0)throw Error("Record not found");arr[i]={...arr[i],...payload};}
 else{const next=Math.max(0,...arr.map(x=>Number(x[pk])||0))+1;arr.push({[pk]:next,...payload,created_at:new Date().toISOString().slice(0,10)});}
}
async function apiRequest(path,options={}){
 const headers={"Accept":"application/json",...(options.body?{"Content-Type":"application/json"}:{}),...(state.token?{"Authorization":"Bearer "+state.token}:{})};
 const res=await fetch(`${API_BASE}/${path}`,{...options,headers:{...headers,...options.headers}});
 let body;try{body=await res.json()}catch{body={message:"The API returned a non-JSON response."}}
 if(!res.ok||body.success===false)throw Error(body.message||`HTTP ${res.status}`);
 return body;
}
async function saveLive(type,payload,id){
 const endpoint={users:"users.php",events:"events.php",venues:"venues.php",schedules:"schedules.php",bookings:"bookings.php"}[type];
 if(!endpoint)throw Error("Unsupported endpoint");
 if(type==="users"&&!payload.password&& !id)throw Error("The user API may require a password. Add the required password field before creating an account.");
 const method=id?"PUT":"POST";const url=endpoint+(id?`?id=${encodeURIComponent(id)}`:"");
 await apiRequest(url,{method,body:JSON.stringify(payload)});
}
async function deleteRecord(type,id){
 if(!confirm("Delete this record? This action may be restricted by related records."))return;
 try{if(state.mode==="live"){const endpoint={users:"users.php",events:"events.php",venues:"venues.php",schedules:"schedules.php"}[type];await apiRequest(`${endpoint}?id=${id}`,{method:"DELETE"});await loadLive();toast("Delete request completed. Confirm the record in the backend.");}
 else{state.data[type]=state.data[type].filter(r=>Number(r[primaryKey(type)])!==id);toast("Record removed from preview mode.");}renderNav();renderPage();}
 catch(err){toast("Could not delete: "+err.message)}
}
function openBooking(eventId){
 const event=eventFor(eventId),schedules=state.data.schedules.filter(s=>Number(s.event_id)===eventId&&Number(s.available_tickets)>0);
 if(!schedules.length){toast("No available ticket schedules for this event yet.");return}
 const root=$("#modal-root");root.innerHTML=`<div class="modal-backdrop" data-backdrop><section class="modal" role="dialog" aria-modal="true"><div class="modal-head"><h2>Book tickets</h2><button class="modal-close" data-close>×</button></div><form id="booking-form"><div class="modal-body"><div class="notice"><b>${esc(event.title)}</b><br>${esc(event.description||"")}</div><div class="field-grid"><label class="field full">Ticket schedule<select name="schedule_id" required>${schedules.map(s=>`<option value="${s.schedule_id}">${dateShort(s.start_time)} · ${esc(String(s.start_time).split(" ")[1]?.slice(0,5)||"")} · ${money(s.ticket_price)} · ${s.available_tickets} available</option>`).join("")}</select></label><label class="field">Quantity<input name="quantity" type="number" min="1" max="${Math.max(...schedules.map(s=>s.available_tickets))}" value="1" required></label></div><p class="muted tiny">Preview bookings are stored only in temporary page state. Live booking behaviour depends on the supplied API validation and database.</p></div><div class="modal-foot"><button type="button" class="btn btn-outline" data-close>Cancel</button><button class="btn btn-primary" type="submit">Confirm booking</button></div></form></section></div>`;
 $$("[data-close]",root).forEach(b=>b.addEventListener("click",closeModal));
 $("#booking-form").addEventListener("submit",async e=>{e.preventDefault();const fd=new FormData(e.currentTarget),schedule=scheduleFor(Number(fd.get("schedule_id"))),qty=Number(fd.get("quantity"));if(!schedule||qty<1||qty>schedule.available_tickets)return toast("Enter a valid quantity within available stock.");
  try{if(state.mode==="live"){await apiRequest("bookings.php",{method:"POST",body:JSON.stringify({schedule_id:schedule.schedule_id,quantity:qty})});await loadLive();toast("Booking request sent. Verify status from the API response.");}
  else{const id=Math.max(0,...state.data.bookings.map(b=>b.booking_id))+1;state.data.bookings.push({booking_id:id,user_id:state.user.user_id,schedule_id:schedule.schedule_id,quantity:qty,total_price:Number(schedule.ticket_price)*qty,booking_status:"confirmed",booked_at:new Date().toISOString().slice(0,19).replace("T"," ")});schedule.available_tickets-=qty;toast("Sample booking created in preview mode.");}
  closeModal();state.page="mybookings";renderNav();renderPage();}catch(err){toast("Booking failed: "+err.message)}
 });
}
async function cancelBooking(id){
 if(!confirm("Cancel this booking?"))return;
 try{if(state.mode==="live"){await apiRequest(`bookings.php?id=${id}`,{method:"PUT",body:JSON.stringify({booking_status:"cancelled"})});await loadLive();toast("Cancellation request sent. Verify the updated status.");}
 else{const b=state.data.bookings.find(x=>Number(x.booking_id)===id);if(b)b.booking_status="cancelled";toast("Sample booking cancelled in preview mode.");}renderPage();}
 catch(err){toast("Could not cancel booking: "+err.message)}
}
async function loadLive(){
 // Endpoints use GET for listing. Some API responses wrap results in data; normalize conservatively.
 const map={users:"users.php",events:"events.php",venues:"venues.php",schedules:"schedules.php",bookings:"bookings.php"};
 for(const [key,path] of Object.entries(map)){
  try{const body=await apiRequest(path);const rows=Array.isArray(body.data)?body.data:(body.data&&typeof body.data==="object"?[body.data]:[]);state.data[key]=rows;}
  catch(err){console.warn(`Could not load ${key}:`,err.message)}
 }
}
$("#login-form").addEventListener("submit",async e=>{
 e.preventDefault();resetMessage();const email=$("#email").value.trim(),password=$("#password").value;
 if(!email||!password)return setMessage("Enter both your email address and password.");
 try{
  const body=await apiRequest("login.php",{method:"POST",body:JSON.stringify({email,password})});
  if(!body.access_token||!body.user||!body.user.role)throw Error("Login response is missing token or user role.");
  state.token=body.access_token;localStorage.setItem("eventora_token",body.access_token);
  const user=body.user;state.data=JSON.parse(JSON.stringify(demo));state.mode="live";
  await loadLive();enterApp(user.role,user,"live",body.access_token);
 }catch(err){setMessage("Login was not successful: "+err.message+" If the database is not set up, use Preview mode to inspect the interface.");}
});
$$("[data-preview]").forEach(b=>b.addEventListener("click",()=>{seedDemo();const role=b.dataset.preview;const user=state.data.users.find(u=>u.role===role)||state.data.users[0];enterApp(role,user,"demo")}));
$("#logout-button").addEventListener("click",()=>{state.role=null;state.user=null;state.mode="demo";state.token=null;localStorage.removeItem("eventora_token");$("#app-shell").classList.add("hidden");$("#login-screen").classList.remove("hidden");$("#password").value="";resetMessage();});
$("#mobile-menu").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
$("#notification-button").addEventListener("click",()=>toast("You're all caught up in this preview."));
$("#help-link").addEventListener("click",e=>{e.preventDefault();toast("For project support, refer to the README and API setup notes.")});
document.addEventListener("click",e=>{const b=e.target.closest("[data-goto]");if(b&&b.dataset.goto){state.page=b.dataset.goto;renderNav();renderPage()}});
