// Starfall Chronicle - content & assets: weapons, gear, enemies, bosses, areas, quests, dialogue,
// plus code-drawn art (sprites, tiles, weapon icons, bosses) and the WebAudio chiptune engine
'use strict';
const RARITY=[
 {n:'Common',c:'#c4c4c4',m:1,aff:0,v:20},
 {n:'Uncommon',c:'#5fd068',m:1.18,aff:1,v:45},
 {n:'Rare',c:'#4aa3ff',m:1.4,aff:1,v:90},
 {n:'Epic',c:'#c07bff',m:1.68,aff:2,v:180},
 {n:'Legendary',c:'#ffa53a',m:2.05,aff:3,v:400}];

// Weapon classes: base damage, attack time, reach, arc, crit bonus, special
const CLASSES={
 sword:{n:'Sword',dmg:10,t:.3,reach:28,arc:1.9,crit:0,combo:[1,1.1,1.6],sp:'Whirlwind',spd:'Spin in a wide circle, striking everything twice.'},
 spear:{n:'Spear',dmg:11,t:.36,reach:44,arc:.6,crit:0,combo:[1,1.35],sp:'Skewer Dash',spd:'Lunge forward invulnerable, piercing all in your path.'},
 bow:{n:'Bow',dmg:8.5,t:.42,reach:240,arc:0,crit:5,combo:[1],sp:'Star Volley',spd:'Loose five piercing arrows in a fan.'},
 staff:{n:'Staff',dmg:9.5,t:.46,reach:200,arc:0,crit:0,combo:[1],sp:'Nova',spd:'Hurl an orb that bursts into a starfire explosion.'},
 dagger:{n:'Twin Daggers',dmg:6,t:.17,reach:22,arc:1.6,crit:15,combo:[1,1,1.1,1.5],sp:'Shadowstep',spd:'Blink between up to four foes, striking each.'}};

// [name, class, rarity, dmgMod, blade, hilt, accent, fixed affix]
const WEAPONS=[
 ['Rusty Shortsword','sword',0,.9,'#a89a8a','#6b4a2a','#888'],
 ['Ironbrand','sword',0,1,'#cfd6de','#5a3b22','#9aa'],
 ["Wayfarer's Blade",'sword',1,1,'#e2e8ef','#3a5fcd','#ffd34a'],
 ['Emberfang','sword',2,1.05,'#ff9a5a','#3a1a1a','#ff4a1a','burn'],
 ['Glacier Edge','sword',2,1,'#bfeaff','#2a4a7a','#7ad8ff','frost'],
 ['Duskreaver','sword',3,1.1,'#7a5aa8','#1a1426','#e05aff','life'],
 ['Starfall Greatblade','sword',4,1.2,'#fff6c8','#2a2a5a','#ffd34a','crit'],
 ['Ash Pike','spear',0,.9,'#b8b0a0','#7a5a3a','#999'],
 ['Iron Halberd','spear',0,1,'#d0d6dc','#5a4030','#aaa'],
 ["Hunter's Lance",'spear',1,1,'#e0e4e8','#3a6a3a','#8fd06a'],
 ['Viper Glaive','spear',2,1.05,'#8fe07a','#2a3a1a','#c0ff4a','life'],
 ['Sunpiercer','spear',2,1,'#ffe08a','#8a5a1a','#ffb02a','burn'],
 ['Tempest Trident','spear',3,1.1,'#9ad8ff','#1a3a5a','#e0f6ff','frost'],
 ['Skyrend Lance','spear',4,1.2,'#ffffff','#4a3a8a','#9ae0ff','crit'],
 ['Willow Shortbow','bow',0,.9,'#a07a4a','#e8e0c8','#7a5a3a'],
 ["Ranger's Longbow",'bow',0,1,'#7a5030','#f0f0e0','#5a3a1a'],
 ['Thornstring','bow',1,1,'#4a7a3a','#d0ffb0','#2a5a1a'],
 ['Gale Recurve','bow',2,1.05,'#c8e8f0','#ffffff','#5ac8e0','swift'],
 ['Moonwhisper','bow',3,1.1,'#b0b8e8','#e8f0ff','#7a8aff','frost'],
 ['Cinderwing','bow',3,1.1,'#c84a2a','#ffd08a','#ff7a1a','burn'],
 ["Comet's Arc",'bow',4,1.2,'#fff0a0','#ffffff','#ffa53a','crit'],
 ['Oak Staff','staff',0,.9,'#8a6a42','#5a4028','#7ad07a'],
 ['Apprentice Rod','staff',0,1,'#6a5a7a','#3a2a4a','#7ab0ff'],
 ['Mossheart Staff','staff',1,1,'#5a7a3a','#3a4a22','#9aff7a'],
 ['Sandglass Scepter','staff',2,1.05,'#d8b878','#8a6a3a','#ffe07a','swift'],
 ['Frostbloom Staff','staff',2,1,'#a8d8e8','#4a6a8a','#bff4ff','frost'],
 ['Voidcaller','staff',3,1.1,'#3a2a4a','#1a1020','#d04aff','life'],
 ['Astral Conduit','staff',4,1.2,'#e8e0ff','#5a4aa8','#fff6a0','crit'],
 ['Rusty Shivs','dagger',0,.9,'#a89a8a','#5a3a22','#888'],
 ['Twin Fangs','dagger',0,1,'#e8e8e8','#4a3a2a','#ccc'],
 ['Nightbite Pair','dagger',1,1,'#7a7aa8','#22223a','#a0a0ff'],
 ['Scorpion Stingers','dagger',2,1.05,'#d8a03a','#4a2a1a','#a0ff4a','burn'],
 ['Frostkiss Twins','dagger',2,1,'#c8f0ff','#2a4a6a','#7ad8ff','frost'],
 ['Shadowsong','dagger',3,1.1,'#4a3a5a','#120c1a','#ff4ad0','life'],
 ['Eclipse Daggers','dagger',4,1.2,'#1a1a2a','#ffd34a','#ff7a1a','crit']];

const AFFIXES={
 burn:{n:'Burning',d:'Ignites foes: {v} dmg/s',r:[3,7]},
 frost:{n:'Frozen',d:'Chills foes: -{v}% speed',r:[25,45]},
 life:{n:'Vampiric',d:'{v}% lifesteal',r:[3,7]},
 crit:{n:'Keen',d:'+{v}% crit chance',r:[6,14]},
 swift:{n:'Swift',d:'+{v}% attack speed',r:[8,18]},
 might:{n:'Mighty',d:'+{v}% damage',r:[8,18]}};

// Armor: [name, rarity, def, hp, bonus]
const ARMORS=[
 ["Traveler's Garb",0,2,0,''],
 ['Leather Jerkin',0,4,10,''],
 ['Ranger Mail',1,6,15,'spd:6'],
 ['Bronze Plate',1,9,25,'spd:-5'],
 ['Dunewalker Robes',2,8,20,'mp:25'],
 ['Scaled Brigandine',2,12,35,''],
 ['Crystal Aegis',3,16,60,'mp:15'],
 ['Starwoven Mantle',4,20,90,'all:8']];
// Trinkets: [name, rarity, bonus, desc]
const TRINKETS=[
 ['Lucky Coin',0,'gold:20','+20% gold found'],
 ['Wolf Tooth',0,'crit:5','+5% crit chance'],
 ['Feather Charm',1,'spd:10','+10% move speed'],
 ['Heartstone',1,'hp:40','+40 max HP'],
 ['Owl Pendant',1,'xp:25','+25% XP gained'],
 ['Stamina Band',2,'st:35','+35 max stamina'],
 ['Ember Ring',2,'elem:40','+40% burn/frost power'],
 ['Sand Clock',2,'as:12','+12% attack speed'],
 ['Mana Prism',3,'mp:40','+40 max mana, faster regen'],
 ['Starlit Locket',4,'all:10','+10% to everything']];

// Half-width pixel sprites (mirrored). k=outline
const SPR={
 slime:['......','......','....kk','..kkgg','.kgwgg','.kwggg','kggegg','kggegg','kggggg','kGgggg','.kGGGG','..kkkk'],
 wolf:['......','.kk...','.kfk..','kfffkk','kfffff','kfyfff','kffffw','.kfFww','.kFFwn','..kFFk','..kFk.','..kk..'],
 shroom:['..kkkk','.krrrr','krrwrr','krwwrr','krrrrr','kkkkkk','...kss','...kes','...kss','...kss','..kkss','..kkkk'],
 scorp:['......','kk...k','aak.ka','.ak.ka','.kakka','..kaaa','..kaea','k.kaaa','.kkAaa','k.kAAa','.k.kAA','....kk'],
 wraith:['....kk','..kkcc','.kcccc','.kckkk','kcckyk','kcckkk','kccccc','kcCccc','.kCccC','.kCcCc','..kCkC','...k.k'],
 bandit:['......','...kkk','..kbbb','..kbbb','..kses','..kddd','.kdddd','kskddd','ks.kdd','...kdd','...kdk','...kk.'],
 bat:['......','......','k.....','kk...k','kpk.kp','kppkpp','kpppep','.kpppp','..kppk','...k.k','......','......'],
 golem:['....cc','...kcc','..kkkk','.kssss','kssyss','kssssk','kcskss','ccksss','kc.kss','...kss','..kssk','..kkk.'],
 shade:['......','...kkk','..kvvv','.kvvvv','.kvmvv','kvvvvv','kvVvvv','kvvVvv','.kvvVv','.kVvkv','..k.kV','......'],
 hero:['...kkk','..khhh','.khhhh','.khsss','.khses','..ksss','..kccw','.kcccc','kscccc','kskbbb','..kccc','..kCCC'],
 heroB:['...kkk','..khhh','.khhhh','.khhhh','.khhhh','..khhh','..kccc','.kcccc','kscccc','kskbbb','..kccc','..kCCC']};

// Enemies. ai: hop|charge|shoot|lunge|blink|swoop|slam
const ENEMIES={
 slime:{n:'Bramble Slime',spr:'slime',pal:{g:'#6fcf4a',G:'#3a8a2a',w:'#d8ffc0',e:'#1a1a1a'},hp:22,dmg:8,spd:30,xp:6,gold:[1,4],ai:'hop',r:6},
 wolf:{n:'Hollow Wolf',spr:'wolf',pal:{f:'#8a8aa0',F:'#5a5a70',y:'#ffd34a',w:'#d8d8e8',n:'#111'},hp:30,dmg:11,spd:46,xp:9,gold:[2,5],ai:'charge',r:6},
 shroom:{n:'Sporecap',spr:'shroom',pal:{r:'#d84a5a',w:'#fff0e0',s:'#f0d8b0',e:'#2a1a1a'},hp:26,dmg:9,spd:18,xp:8,gold:[1,5],ai:'shoot',r:6,proj:'spore'},
 scorp:{n:'Dune Scorpion',spr:'scorp',pal:{a:'#e0a040',A:'#9a6020',e:'#ff3a3a'},hp:34,dmg:12,spd:40,xp:12,gold:[3,7],ai:'lunge',r:6},
 wraith:{n:'Dust Wraith',spr:'wraith',pal:{c:'#c8a878',C:'#8a6a48',y:'#7affff'},hp:30,dmg:12,spd:30,xp:13,gold:[3,8],ai:'blink',r:6,proj:'sand'},
 bandit:{n:'Sand Bandit',spr:'bandit',pal:{b:'#c83a3a',s:'#e0b088',e:'#1a1a1a',d:'#5a4a3a'},hp:40,dmg:12,spd:36,xp:14,gold:[5,11],ai:'shoot',r:6,proj:'knife'},
 bat:{n:'Prism Bat',spr:'bat',pal:{p:'#9a6ae0',e:'#ff5ad0'},hp:28,dmg:12,spd:62,xp:13,gold:[3,7],ai:'swoop',r:5},
 golem:{n:'Crystal Golemite',spr:'golem',pal:{s:'#6a7a9a',c:'#7af0ff',y:'#ffec5a'},hp:70,dmg:18,spd:22,xp:20,gold:[5,12],ai:'slam',r:7},
 shade:{n:'Starless Shade',spr:'shade',pal:{v:'#2a1a40',V:'#140a24',m:'#ff4ae0'},hp:40,dmg:14,spd:34,xp:18,gold:[4,10],ai:'blink',r:6,proj:'void'}};

// Bosses: phases list attack patterns; hp thresholds
const BOSSES={
 thorn:{n:'The Thornmother',hp:1500,dmg:16,r:22,spd:26,xp:300,gold:250,col:'#3f7a2a',acc:'#ff6aa0',shard:1,
  phases:[{at:1,atk:['lines','ring','slam'],cd:1.5},{at:.5,atk:['lines','summon','ring','slam','lines'],cd:1.05,msg:'The Thornmother uproots in fury!'}],adds:['slime','wolf']},
 sentinel:{n:'The Gilded Sentinel',hp:4200,dmg:24,r:22,spd:32,xp:900,gold:600,col:'#c8a040',acc:'#5affff',shard:2,
  phases:[{at:1,atk:['slam','charge','ring'],cd:1.4},{at:.55,atk:['spiral','charge','meteors','slam'],cd:1.0,msg:'Ancient gears grind - the Sentinel overclocks!'}],adds:['scorp']},
 vael:{n:'Vael, the Starfallen',hp:9000,dmg:30,r:20,spd:40,xp:0,gold:1500,col:'#e8e0ff',acc:'#ffd34a',shard:3,
  phases:[{at:1,atk:['homing','teleport','ring','lines'],cd:1.3},{at:.6,atk:['meteors','teleport','spiral','homing'],cd:1.0,msg:'Vael blazes white-hot!'},{at:.25,atk:['spiral','meteors','summon','ring','homing'],cd:.8,msg:'"Let me burn out!"'}],adds:['shade','bat']}};

// Areas. Procedural caves/forests carved between key points (tile coords)
const AREAS={
 town:{name:'Lanternreach',music:'town',lvl:1,town:1},
 forest:{name:'Whisperwood',music:'forest',W:74,H:54,seed:1337,lvl:1,lvlMax:4,wall:'#',floor:'.',alt:',',edge:'o',fill:.5,dark:0,
  pts:{entry:[4,27],a:[20,10],b:[30,42],c:[48,12],d:[54,40],boss:[66,26]},path:['entry','a','c','boss','d','b','entry'],chests:['a','b','c','d'],
  enemies:['slime','slime','wolf','shroom'],count:38,boss:'thorn',tint:'rgba(20,60,30,.12)',fx:'leaf'},
 desert:{name:'Sunken Ruins of Kharos',music:'desert',W:78,H:56,seed:4242,lvl:5,lvlMax:9,wall:'Y',floor:'S',alt:'r',edge:'P',fill:.56,dark:0,
  pts:{entry:[4,28],a:[22,12],b:[24,44],c:[46,28],d:[60,10],e:[58,46],boss:[70,28]},path:['entry','a','d','boss','e','b','entry','c','boss'],chests:['a','b','d','e','c'],
  enemies:['scorp','scorp','wraith','bandit','bandit'],count:44,boss:'sentinel',tint:'rgba(120,70,10,.12)',fx:'dust'},
 cave:{name:'The Prism Deep',music:'cave',W:80,H:58,seed:777,lvl:10,lvlMax:14,wall:'X',floor:'c',alt:'q',edge:'C',fill:.5,dark:.55,
  pts:{entry:[4,29],a:[20,10],b:[22,48],c:[42,30],d:[60,10],e:[60,48],boss:[72,29]},path:['entry','a','c','d','boss','e','b','entry','c','e'],chests:['a','b','d','e'],
  enemies:['bat','bat','golem','shade','shade'],count:48,boss:'vael',tint:'rgba(40,20,90,.15)',fx:'spark',pylons:['a','b','d']}};

// Main quest stages (quest log text)
const MAINQ=[
 'Speak with Elder Oren in the town hall plaza.',
 'Act I - The Rooted Light: Enter Whisperwood (north gate) and recover the first Star Shard.',
 'Act I - Bring the first Star Shard to Elder Oren.',
 'Act II - The Gilded Silence: Cross the east gate into the Sunken Ruins of Kharos.',
 'Act II - Bring the second Star Shard to Elder Oren.',
 'Act III - Heart of the Starfall: Descend through the south mine into the Prism Deep.',
 'The Starfall Chronicle is complete. Lanternreach is safe.'];
const SIDEQ={
 glow:{n:'Glowcap Gathering',giver:'Mira',need:6,d:'Collect Glowcaps in Whisperwood for Mira.'},
 bounty:{n:'Dune Raiders',giver:'Captain Dace',need:10,d:'Defeat Sand Bandits in the Ruins of Kharos.'},
 echo:{n:'Echoes in the Deep',giver:'Vesna',need:3,d:'Attune the Echo Pylons in the Prism Deep.'}};

// NPC definitions (town tile positions set by map builder)
const NPCS={
 oren:{n:'Elder Oren',pal:{h:'#e8e8f0',c:'#6b4fa0',C:'#4a3570',s:'#f0c8a0',b:'#c8a040'}},
 brann:{n:'Brann the Smith',pal:{h:'#c84a2a',c:'#5a4a3a',C:'#3a2a20',s:'#d8a078',b:'#222'}},
 sela:{n:'Sela the Merchant',pal:{h:'#3a2a1a',c:'#2a8a7a',C:'#1a5a50',s:'#e8c098',b:'#ffd34a'}},
 mira:{n:'Mira the Herbalist',pal:{h:'#5ac85a',c:'#e8e0c0',C:'#a8a080',s:'#f0d0b0',b:'#6a8a3a'}},
 dace:{n:'Captain Dace',pal:{h:'#8a8a8a',c:'#8a2a2a',C:'#5a1a1a',s:'#c89068',b:'#c8c8c8'}},
 vesna:{n:'Vesna the Astronomer',pal:{h:'#1a1a3a',c:'#2a3a8a',C:'#1a2050',s:'#f0d0b8',b:'#ffd34a'}}};

// Dialogue: arrays of lines. Line: [speaker,text] or {s,t,ch:[[label,next,action]]}
const DLG={
 intro:[['','Seven nights ago, a star fell over Lanternreach.'],['','Its light shattered into three Star Shards - and wherever they landed, the land began to twist.'],['','You are the wanderer who watched it fall. And the town elder has asked for you.']],
 oren0:[['Elder Oren','Ah... the wanderer who watched the sky burn. Lanternreach needs you.'],['Elder Oren','The Star Shards took root in three places: Whisperwood to the north, the Sunken Ruins of Kharos to the east, and the Prism Deep below our mine.'],
  {s:'Elder Oren',t:'Something guards each shard. Something the shard is... feeding. Will you bring them home?',ch:[["I'll bring the shards back.",'oren0y','main1'],['Why me?','oren0w']]}],
 oren0w:[{s:'Elder Oren',t:'Because the star chose to fall where you stood. That is not chance, friend.',ch:[["Then I'll go.",'oren0y','main1'],['Let me prepare first.',null,'main1']]}],
 oren0y:[['Elder Oren','Bless you. The north gate is open. Brann the smith can temper your steel, and Sela sells potions.'],['Elder Oren','Take this old blade - and this purse. The road is cruel to the empty-handed.']],
 oren1:[['Elder Oren','Whisperwood lies past the north gate. Follow the old trails - the shard\'s glow will be deep in the wood.']],
 oren2:[['Elder Oren','The shard... it is warm, like a heartbeat.'],['Elder Oren','The Thornmother was once Whisperwood\'s guardian spirit. The fallen light drove her mad. Perhaps now she can rest.'],
  {s:'Elder Oren',t:'I have sent word to Captain Dace. The east gate to the Ruins of Kharos is yours.',ch:[['Onward, then.',null,'main3']]}],
 oren3:[['Elder Oren','The Ruins of Kharos are past the east gate. Mind the sand bandits - they have grown bold since the star fell.']],
 oren4:[['Elder Oren','Two shards. Listen... they hum together, and something deep below answers.'],['Elder Oren','Vesna\'s instruments went wild last night. Whatever waits in the Prism Deep is no guardian.'],
  {s:'Elder Oren',t:'It is the star itself. The south mine is open. Go - and come back to us.',ch:[["I'll come back.",null,'main5']]}],
 oren5:[['Elder Oren','The mine to the south leads into the Prism Deep. May the old light guide you.']],
 oren6:[['Elder Oren','Lanternreach will tell your story for a hundred years. Rest, hero - or keep hunting, if your blade still itches.']],
 brann:[{s:'Brann the Smith',t:'Steel sings when it is loved. Need something sharpened, reforged, or fused?',ch:[['Open the forge','', 'smith'],['Tell me about upgrades.','brann1'],['Later.',null]]}],
 brann1:[['Brann the Smith','Upgrades take gold and Star Ore. Up to +5 never fails. Past that, the metal fights back - a failed hammer costs only your coin.'],['Brann the Smith','Reforging rerolls a weapon\'s enchantments. Fusing two weapons of the same rarity forges one of the next tier. Legendaries cannot be fused.']],
 sela:[{s:'Sela the Merchant',t:'Potions, ore, and a few curiosities. Coin talks, friend.',ch:[['Browse wares','','shop'],['Goodbye.',null]]}],
 mira0:[['Mira the Herbalist','Oh! Careful with your boots - those are my seedlings.'],{s:'Mira the Herbalist',t:'Glowcaps only bloom in Whisperwood, and the wolves won\'t let me near. Could you gather six for me?',ch:[['Of course.',null,'q_glow'],['Not right now.',null]]}],
 mira1:[['Mira the Herbalist','Glowcaps shine blue-green in the undergrowth. You can\'t miss them in the dark.']],
 mira2:[['Mira the Herbalist','Six glowcaps! They smell like rain. Here - my heartstone charm, and a few of my best tonics.']],
 mira3:[['Mira the Herbalist','My tonics are brewing beautifully, thanks to you.']],
 dace0:[['Captain Dace','The east road is sealed by the Elder\'s order. Nobody goes to Kharos until he says so.']],
 dacek:[['Captain Dace','The Elder gave the word. The east gate is yours.'],{s:'Captain Dace',t:'While you\'re out there: sand bandits have been raiding our caravans. Thin them out - ten should send a message.',ch:[['Consider it done.',null,'q_bounty'],['Maybe later.',null]]}],
 dace1:[['Captain Dace','Ten bandits, wanderer. They hide among the pillars and throw knives.']],
 dace2:[['Captain Dace','Ten! The caravans will roll again. Take this - it was confiscated from their leader.']],
 dace3:[['Captain Dace','Roads are quiet. That\'s your doing.']],
 vesna0:[['Vesna the Astronomer','I tracked the star\'s fall to the inch. Everyone laughed. Nobody is laughing now.']],
 vesnak:[['Vesna the Astronomer','The Prism Deep has three Echo Pylons - ancient crystals that once sang with the stars.'],{s:'Vesna the Astronomer',t:'If you attune them, I can finally hear what the star is saying. Will you?',ch:[['I\'ll attune them.',null,'q_echo'],['Not now.',null]]}],
 vesna1:[['Vesna the Astronomer','Touch each pylon and hold still while it hums. Three in total.']],
 vesna2:[['Vesna the Astronomer','I hear it... it is not angry. It is lonely. Take this aegis - it was cut from a crystal that fell with the star.']],
 vesna3:[['Vesna the Astronomer','Every night the sky looks a little kinder.']],
 guardE:[['Gate Guard','By order of the Elder, the east gate stays shut. Speak with him first.']],
 guardS:[['Miner','The mine\'s collapsed into something... glowing. Elder Oren says no one goes down. Not yet.']],
 fountain:[['','The fountain\'s water glitters with fallen starlight. You feel restored.']],
 vael:[['Vael, the Starfallen','...You held all three pieces of me, and still you did not run.'],['Vael, the Starfallen','I fell because I was so tired of burning alone in the dark.'],
  {s:'Vael, the Starfallen',t:'Tell me, little light. What should I become?',ch:[['Return to the sky.','endA','endA'],['Stay, and be our light.','endB','endB']]}],
 endA:[['','You raise the three shards. They rise, fuse, and the star climbs slowly home.'],['','Every night after, it shines a little brighter over Lanternreach - as if it is watching you.']],
 endB:[['','The star settles into the crystal heart of the Deep. The caves glow warm and gold.'],['','Lanternreach never needs lanterns again. Children say the mine hums lullabies.']]};

// Lore stones placed at area point 'a'
const LORE={forest:'"Here the Thornmother sang the first seeds awake." - carved in an old root-stone.',desert:'"Kharos built the Sentinel to guard the sky-gate. The sky did not need guarding." - a cracked tablet.',cave:'"The stars remember everyone who looks up." - letters of light in the crystal.'};

// Music: tokens of 8th notes. '.' rest. drums: k kick s snare h hat
const MUSIC={
 title:{bpm:88,lead:'g4 . c5 . d5 . e5 . . . d5 . c5 . g4 . a4 . c5 . d5 . g5 . . . e5 . d5 . . .',bass:'c3 . . . g2 . . . a2 . . . e2 . . . f2 . . . c3 . . . g2 . . . g2 . . .',dr:'k . . . h . . . k . . . h . . .'},
 town:{bpm:112,lead:'e5 . g5 e5 d5 . c5 d5 e5 . g5 . a5 g5 e5 . f5 . a5 f5 e5 . d5 e5 d5 . b4 . c5 . . .',bass:'c3 . g3 . c3 . g3 . a2 . e3 . a2 . e3 . f2 . c3 . f2 . c3 . g2 . d3 . g2 . b2 .',dr:'k . h . s . h . k . h . s . h h'},
 forest:{bpm:96,lead:'a4 . c5 e5 . d5 c5 . b4 . g4 . a4 . . . e5 . g5 a5 . g5 e5 . d5 . c5 b4 a4 . . .',bass:'a2 . e3 . a2 . e3 . g2 . d3 . g2 . d3 . f2 . c3 . f2 . c3 . e2 . b2 . e2 . g#2 .',dr:'k . . h s . . h k . k h s . . h'},
 desert:{bpm:104,lead:'e5 f5 g#5 . f5 e5 . . b4 c5 d5 . c5 b4 . . e5 . f5 e5 d5 c5 b4 . a4 . g#4 . e4 . . .',bass:'e2 . . e2 b2 . e2 . f2 . . f2 c3 . f2 . e2 . . e2 b2 . e2 . d2 . . d2 g#2 . b2 .',dr:'k . s k . k s . k . s k . k s s'},
 cave:{bpm:84,lead:'d5 . a4 . f5 . a4 . e5 . a4 . c#5 . a4 . d5 . f5 . a5 . f5 . g5 . e5 . c#5 . . .',bass:'d2 . . . d2 . . . a1 . . . a1 . . . a#1 . . . a#1 . . . a1 . . . a1 . . .',dr:'k . . . . . h . s . . . . . h .'},
 boss:{bpm:150,lead:'c5 c5 d#5 c5 g5 . f5 d#5 d5 d5 f5 d5 g#5 . g5 f5 c5 c5 d#5 c5 g5 . a#5 . g#5 g5 f5 d#5 d5 . b4 .',bass:'c2 c3 c2 c3 c2 c3 c2 c3 a#1 a#2 a#1 a#2 a#1 a#2 a#1 a#2 g#1 g#2 g#1 g#2 g#1 g#2 g#1 g#2 g1 g2 g1 g2 g1 g2 b1 b2',dr:'k h s h k k s h k h s h k k s s'},
 end:{bpm:76,lead:'c5 . e5 . g5 . . . f5 . e5 . d5 . . . a4 . c5 . e5 . . . d5 . . . . . . .',bass:'c3 . . . a2 . . . f2 . . . g2 . . . a2 . . . f2 . . . g2 . . . c3 . . .',dr:'k . . . . . . . s . . . . . . .'}};

// Skill tree: branches of 4. a=active skill id
const SKILLS=[
 {id:'m1',b:0,n:'Sharpened Edge',d:'+12% damage',lv:1},
 {id:'m2',b:0,n:'Brutal Crits',d:'Crits deal +50% more',lv:3,req:'m1'},
 {id:'m3',b:0,n:'War Cry',d:'ACTIVE: +40% damage for 8s (25 MP)',lv:5,req:'m2',a:'warcry'},
 {id:'m4',b:0,n:'Executioner',d:'+35% damage to foes under 30% HP',lv:9,req:'m3'},
 {id:'g1',b:1,n:'Fleet Foot',d:'+10% move speed',lv:1},
 {id:'g2',b:1,n:'Second Wind',d:'+40% stamina regen',lv:3,req:'g1'},
 {id:'g3',b:1,n:'Phantom Roll',d:'Dodges are longer and leave a damaging afterimage',lv:6,req:'g2'},
 {id:'g4',b:1,n:'Blade Dancer',d:'+15% attack speed, specials cost less',lv:10,req:'g3'},
 {id:'a1',b:2,n:'Mana Well',d:'+30 max mana, faster regen',lv:1},
 {id:'a2',b:2,n:'Healing Light',d:'ACTIVE: heal 35% HP (30 MP)',lv:2,req:'a1',a:'heal'},
 {id:'a3',b:2,n:'Elemental Mastery',d:'Burn, frost and lifesteal +50%',lv:6,req:'a2'},
 {id:'a4',b:2,n:'Starfall',d:'ACTIVE: call down a meteor (40 MP)',lv:8,req:'a3',a:'starfall'}];
const BRANCHES=['Might','Grace','Arcane'];

// =====================================================================
// CODE-DRAWN ART & AUDIO (uses globals from game.js at call time)
// =====================================================================
// ---------- AUDIO ----------
const AU={c:null,on:true,trk:null,name:'',step:0,next:0};
function auInit(){if(AU.c)return;try{const c=AU.c=new(window.AudioContext||window.webkitAudioContext)();AU.m=c.createGain();AU.m.gain.value=AU.on?.5:0;AU.m.connect(c.destination);
 AU.mu=c.createGain();AU.mu.gain.value=.32;AU.mu.connect(AU.m);AU.fx=c.createGain();AU.fx.gain.value=.55;AU.fx.connect(AU.m);
 const b=AU.nb=c.createBuffer(1,c.sampleRate*.5,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
 setInterval(sched,40);if(AU.name){const n=AU.name;AU.name='';music(n)}}catch(e){AU.c=null}}
function setSound(on){AU.on=on;if(AU.m)AU.m.gain.value=on?.5:0;try{localStorage.setItem('sfc_snd',on?'1':'0')}catch(e){}}
try{AU.on=localStorage.getItem('sfc_snd')!=='0'}catch(e){}
function nf(n){const m=/^([a-g])(#?)(\d)$/.exec(n);if(!m)return 0;const s={c:0,d:2,e:4,f:5,g:7,a:9,b:11}[m[1]]+(m[2]?1:0);return 440*Math.pow(2,((+m[3]+1)*12+s-69)/12)}
function tone(f,t,d,type,v,dest,sl){const c=AU.c,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(sl)o.frequency.exponentialRampToValueAtTime(sl,t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(dest);o.start(t);o.stop(t+d+.05)}
function noise(t,d,v,dest,hp){const c=AU.c,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=AU.nb;f.type='highpass';f.frequency.value=hp;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);s.connect(f);f.connect(g);g.connect(dest);s.start(t);s.stop(t+d+.05)}
function music(k){if(AU.name===k)return;AU.name=k;const m=MUSIC[k];if(!m)return;AU.trk={bpm:m.bpm,l:m.lead.split(' '),b:m.bass.split(' '),d:m.dr.split(' ')};AU.step=0;if(AU.c)AU.next=AU.c.currentTime+.15}
function sched(){const c=AU.c,k=AU.trk;if(!c||!k||!AU.on)return;const sd=60/k.bpm/2;if(AU.next<c.currentTime-.3)AU.next=c.currentTime+.05;
 while(AU.next<c.currentTime+.25){const i=AU.step,t=AU.next,L=k.l[i%k.l.length],B=k.b[i%k.b.length],D=k.d[i%k.d.length];
  if(L&&L!=='.'){tone(nf(L),t,sd*1.7,'square',.07,AU.mu);tone(nf(L)*1.005,t,sd*1.2,'square',.025,AU.mu)}
  if(B&&B!=='.')tone(nf(B),t,sd*1.9,'triangle',.2,AU.mu);
  if(D==='k')tone(140,t,.14,'sine',.45,AU.mu,40);else if(D==='s')noise(t,.12,.22,AU.mu,1400);else if(D==='h')noise(t,.03,.08,AU.mu,7000);
  AU.step++;AU.next+=sd}}
function sfx(n){const c=AU.c;if(!c||!AU.on)return;const t=c.currentTime,F=AU.fx;switch(n){
 case'swing':noise(t,.09,.2,F,2500);break;case'hit':tone(220,t,.08,'square',.18,F,90);noise(t,.06,.2,F,800);break;
 case'crit':tone(660,t,.12,'square',.15,F,180);noise(t,.1,.3,F,600);break;case'hurt':tone(180,t,.2,'sawtooth',.2,F,60);break;
 case'dodge':noise(t,.15,.15,F,4000);break;case'coin':tone(988,t,.06,'square',.1,F);tone(1319,t+.06,.1,'square',.1,F);break;
 case'pick':tone(523,t,.08,'triangle',.25,F);tone(784,t+.07,.12,'triangle',.25,F);break;
 case'lvl':[523,659,784,1047].forEach((f,i)=>tone(f,t+i*.09,.25,'square',.12,F));break;
 case'shoot':tone(880,t,.1,'triangle',.15,F,300);break;case'magic':tone(400,t,.25,'sine',.2,F,1200);break;
 case'boom':tone(90,t,.5,'sawtooth',.3,F,30);noise(t,.4,.35,F,200);break;case'ui':tone(660,t,.05,'square',.08,F);break;
 case'fail':tone(300,t,.15,'square',.15,F,150);tone(200,t+.12,.2,'square',.15,F,100);break;
 case'forge':noise(t,.08,.3,F,3000);tone(1200,t,.3,'triangle',.15,F,1100);break;case'tele':tone(300,t,.12,'sine',.06,F,500);break;
 case'chest':[392,523,659,784,1047].forEach((f,i)=>tone(f,t+i*.06,.2,'triangle',.18,F));break}}

// ---------- SPRITES ----------
const CACHE={};
function mkSpr(half,pal,flash){const w=half[0].length*2,h=half.length,c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');
 half.forEach((row,y)=>{const full=row+[...row].reverse().join('');for(let x=0;x<w;x++){const ch=full[x];if(ch==='.')continue;g.fillStyle=flash?'#fff':ch==='k'?'#140c1c':(pal[ch]||'#f0f');g.fillRect(x,y,1,1)}});return c}
function spr(key,pal,id,flash){const k=id+(flash?'!':'');return CACHE[k]||(CACHE[k]=mkSpr(SPR[key],pal,flash))}
// weapon icon 16x16 pointing up-right, grip at (2,13)
function wIcon(i){const k='w'+i;if(CACHE[k])return CACHE[k];const W=WEAPONS[i],[,cl,r,,b,h,a]=W,c=document.createElement('canvas');c.width=c.height=16;const g=c.getContext('2d');
 const P=(x,y,col)=>{g.fillStyle=col;g.fillRect(x,y,1,1)},line=(x0,y0,x1,y1,col,w=1)=>{const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0));for(let s=0;s<=n;s++){const x=Math.round(x0+(x1-x0)*s/n),y=Math.round(y0+(y1-y0)*s/n);for(let q=0;q<w;q++)P(x+q,y,col)}};
 const v=i%3;
 if(cl==='sword'){const L=r>2?1:v;line(5,10,13-L,2+L,b,3);line(6,10,14-L,2+L,'#fff8');P(14-L,1+L,'#fff');line(3,8,7,12,h,1);line(2,13,4,11,h,2);P(1,14,a);P(4,9,a);if(r>2){line(8,8,11,5,a)}}
 else if(cl==='spear'){line(1,14,11,4,h,1);line(2,14,11,5,'#0004');line(11,4,14,1,b,2);P(15,0,'#fff');line(10,3,12,5,a);if(r>1){P(9,3,a);P(13,6,a)}}
 else if(cl==='bow'){for(let s=0;s<=12;s++){const t=s/12*PI*.9+PI*.05,x=Math.round(8+Math.cos(t-PI*.75)*7.5),y=Math.round(8+Math.sin(t-PI*.75)*7.5);P(x,y,b);P(x+1,y,b)}line(2,9,9,2,h);P(6,6,a);P(7,5,a);if(r>2){P(2,3,a);P(12,13,a)}}
 else if(cl==='staff'){line(1,15,10,6,b,1);line(2,15,11,6,h);g.fillStyle=a;g.beginPath();g.arc(12.5,3.5,2.6,0,TAU);g.fill();P(12,3,'#fff');if(r>1){P(9,2,a);P(15,6,a)}}
 else{line(2,13,8,7,b,2);P(9,6,'#fff');line(1,12,3,14,h);line(8,13,14,7,b,1);line(9,13,14,8,'#fff6');P(15,6,'#fff');line(7,12,9,14,h);P(5,10,a);P(11,10,a)}
 const im=g.getImageData(0,0,16,16),dd=im.data,o=new Uint8Array(256);for(let y=0;y<16;y++)for(let x=0;x<16;x++){if(dd[(y*16+x)*4+3])continue;for(const[i,j]of[[1,0],[-1,0],[0,1],[0,-1]]){const X=x+i,Y=y+j;if(X>=0&&Y>=0&&X<16&&Y<16&&dd[(Y*16+X)*4+3]>128){o[y*16+x]=1;break}}}
 for(let i=0;i<256;i++)if(o[i]){dd[i*4]=20;dd[i*4+1]=12;dd[i*4+2]=28;dd[i*4+3]=255}g.putImageData(im,0,0);
 return CACHE[k]=c}
function itemIcon(it){if(it.k==='w')return wIcon(it.i);const k=it.k+it.i;if(CACHE[k])return CACHE[k];const c=document.createElement('canvas');c.width=c.height=16;const g=c.getContext('2d'),col=RARITY[it.r].c;
 if(it.k==='a'){g.fillStyle='#140c1c';g.fillRect(3,2,10,13);g.fillStyle=col;g.fillRect(4,3,8,11);g.fillRect(1,3,3,4);g.fillRect(12,3,3,4);g.fillStyle='#0003';g.fillRect(8,3,4,11);g.fillStyle='#fff8';g.fillRect(5,4,2,6)}
 else{g.strokeStyle='#c8a040';g.lineWidth=1;g.beginPath();g.moveTo(4,1);g.lineTo(8,8);g.lineTo(12,1);g.stroke();g.fillStyle='#140c1c';g.beginPath();g.arc(8,10,5,0,TAU);g.fill();g.fillStyle=col;g.beginPath();g.arc(8,10,4,0,TAU);g.fill();g.fillStyle='#fff';g.fillRect(6,8,2,2)}
 return CACHE[k]=c}
// pixel digits 3x5
const DIG=['111101101101111','010110010010111','111001111100111','111001111001111','101101111001001','111100111001111','111100111101111','111001010010010','111101111101111','111101111001111'];
function drawNum(n,x,y,col,s=1){const str=String(n),w=str.length*4*s;x=Math.round(x-w/2);y=Math.round(y);for(const ch of str){const d=DIG[ch];if(d){for(let i=0;i<15;i++)if(d[i]==='1'){cx.fillStyle='#140c1c';cx.fillRect(x+(i%3)*s+1,y+(i/3|0)*s+1,s,s)}for(let i=0;i<15;i++)if(d[i]==='1'){cx.fillStyle=col;cx.fillRect(x+(i%3)*s,y+(i/3|0)*s,s,s)}}x+=4*s}}

// ---------- TILES ----------
const SOLID=new Set('#oWRDFLYPXCAK~'.split(''));
function drawTile(g,ch,x,y,R,base,deep){const X=x*T,Y=y*T,F=(c,a,b,w,h)=>{g.fillStyle=c;g.fillRect(X+a,Y+b,w,h)},sp=(c,n)=>{g.fillStyle=c;for(let i=0;i<n;i++)g.fillRect(X+(R()*16|0),Y+(R()*16|0),1,1)},circ=(c,a,b,r)=>{g.fillStyle=c;g.beginPath();g.arc(X+a,Y+b,r,0,TAU);g.fill()};
 const under=()=>drawTile(g,base,x,y,R,base);
 switch(ch){
 case'.':F('#4f9a3c',0,0,16,16);sp('#62b04c',10);sp('#3f8030',6);break;
 case',':under();for(let i=0;i<3;i++){const c=pick(['#ffd34a','#ff7aa0','#fff','#9ad0ff']),a=1+R()*12|0,b=1+R()*12|0;F(c,a,b+1,3,1);F(c,a+1,b,1,3);F('#ffe',a+1,b+1,1,1)}break;
 case'#':if(deep){F('#1f4a22',0,0,16,16);sp('#2a6a2a',14);sp('#16351a',10);break}under();F('#5a3a22',6,9,4,7);circ('#245a26',8,7,7.5);circ('#2f7a30',6,5,4.5);circ('#3f9038',5,4,2);sp('#163a18',5);break;
 case'o':under();F('#55555e',2,6,12,9);F('#7a7a86',3,5,9,4);F('#9a9aa6',4,5,4,2);F('#3a3a44',2,14,12,1);break;
 case'~':F('#2a62b0',0,0,16,16);sp('#3a7ad0',12);F('#7ab8f0',2+R()*6|0,4,4,1);F('#7ab8f0',6+R()*6|0,11,4,1);break;
 case'=':case'N':case'E':F('#b8a07a',0,0,16,16);F('#9a8460',0,7,16,1);F('#9a8460',0,15,16,1);F('#9a8460',(y%2)*8+3,0,1,7);F('#9a8460',(y%2)*8+11,8,1,7);sp('#c8b08a',6);if(ch!=='='){F('#6a4a2a',0,0,2,16);F('#6a4a2a',14,0,2,16)}break;
 case'M':F('#b8a07a',0,0,16,16);F('#120c18',2,3,12,13);F('#6a4a2a',1,1,14,3);F('#6a4a2a',1,1,2,15);F('#6a4a2a',13,1,2,15);F('#ffd34a',7,2,2,1);break;
 case'W':F('#e2d2b0',0,0,16,16);F('#7a5030',0,0,16,2);F('#7a5030',0,14,16,2);F('#7a5030',0,0,1,16);F('#3a2a1a',5,4,6,7);F('#ffd870',6,5,4,5);F('#3a2a1a',8,5,1,5);break;
 case'R':F('#a84a3a',0,0,16,16);for(let r=0;r<4;r++){F('#7a2e22',0,r*4+3,16,1);F('#7a2e22',(r%2)*4+2,r*4,1,3);F('#7a2e22',(r%2)*4+10,r*4,1,3)}sp('#c85a48',6);break;
 case'D':drawTile(g,'W',x,y,R,base);F('#6a4022',3,2,10,14);F('#4a2a12',3,2,10,1);F('#4a2a12',8,2,1,14);F('#ffd34a',10,9,1,1);break;
 case'F':under();F('#8a6a42',0,6,16,2);F('#8a6a42',0,11,16,2);F('#6a4a2a',2,4,2,11);F('#6a4a2a',12,4,2,11);break;
 case'L':under();F('#2a2a3a',7,4,2,12);F('#3a3a4a',5,14,6,2);F('#ffd870',5,0,6,5);F('#fff8d0',6,1,4,3);break;
 case'A':under();F('#2a2a30',6,10,4,5);F('#3a3a44',3,6,10,4);F('#5a5a66',2,5,12,2);F('#ff7a2a',7,4,2,1);break;
 case'K':under();F('#8a6a42',1,7,14,9);F('#5a4022',1,7,14,1);F('#d84a4a',0,2,16,5);F('#fff',2,2,3,5);F('#fff',9,2,3,5);F('#ffd34a',4,9,2,2);F('#7ad07a',9,10,3,2);break;
 case'S':F('#dcc088',0,0,16,16);sp('#e8d29a',10);sp('#c4a470',8);break;
 case'r':F('#dcc088',0,0,16,16);F('#c8ae7c',1,1,6,6);F('#c8ae7c',9,1,6,6);F('#c8ae7c',1,9,6,6);F('#c8ae7c',9,9,6,6);sp('#a88a58',5);break;
 case'Y':if(deep){F('#6a4a2a',0,0,16,16);sp('#5a3a20',12);break}F('#a87a48',0,0,16,16);F('#8a5a30',0,4,16,2);F('#c89a60',0,9,16,1);F('#8a5a30',0,13,16,2);sp('#6a4a2a',6);break;
 case'P':under();F('#3a2a1a40',3,13,11,3);F('#e0d0a8',4,1,8,14);F('#b8a078',10,1,2,14);F('#f0e8c8',3,0,10,2);F('#f0e8c8',3,13,10,2);F('#a89068',6,6,1,4);break;
 case'c':F('#3a3058',0,0,16,16);sp('#4a3e6e',10);sp('#2a2244',8);break;
 case'q':F('#3a3058',0,0,16,16);sp('#4a3e6e',8);sp('#5ae0ff',3);sp('#c07aff',2);break;
 case'X':if(deep){F('#0c0818',0,0,16,16);sp('#16102a',8);break}F('#16102a',0,0,16,16);F('#2a2048',R()*8|0,R()*8|0,5,3);F('#2a2048',R()*8+4|0,R()*6+8|0,4,2);sp('#3a2c60',4);break;
 case'C':under();g.fillStyle='#3aa0c0';g.beginPath();g.moveTo(X+3,Y+15);g.lineTo(X+5,Y+3);g.lineTo(X+8,Y+15);g.fill();g.fillStyle='#7af0ff';g.beginPath();g.moveTo(X+6,Y+15);g.lineTo(X+10,Y+1);g.lineTo(X+13,Y+15);g.fill();g.fillStyle='#c07aff';g.beginPath();g.moveTo(X+10,Y+15);g.lineTo(X+13,Y+8);g.lineTo(X+15,Y+15);g.fill();F('#fff',9,4,1,4);break;
 default:F('#f0f',0,0,16,16)}}

// ---------- BOSS / PROP ART ----------
function drawBoss(b){const t=b.t,x=b.x,y=b.y-12;cx.globalAlpha=b.vis;cx.fillStyle='#0005';cx.beginPath();cx.ellipse(b.x,b.y+2,b.r,6,0,0,TAU);cx.fill();const fl=b.flash>0,col=fl?'#fff':b.d.col,acc=fl?'#fff':b.d.acc;
 if(b.id==='thorn'){for(let i=0;i<10;i++){const a=t*.6+i/10*TAU,r=b.r+5+Math.sin(t*3+i)*2;cx.fillStyle=fl?'#fff':'#5a3a1a';cx.beginPath();cx.moveTo(x+Math.cos(a-.15)*b.r*.8,y+Math.sin(a-.15)*b.r*.8);cx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);cx.lineTo(x+Math.cos(a+.15)*b.r*.8,y+Math.sin(a+.15)*b.r*.8);cx.fill()}
  cx.fillStyle='#140c1c';cx.beginPath();cx.arc(x,y,b.r*.85+1,0,TAU);cx.fill();cx.fillStyle=col;cx.beginPath();cx.arc(x,y,b.r*.85,0,TAU);cx.fill();cx.fillStyle='#2a5a1a';cx.beginPath();cx.arc(x+4,y+4,b.r*.6,0,TAU);cx.fill();
  for(let i=0;i<6;i++){const a=i/6*TAU-t;cx.fillStyle=b.ph?'#ff3a6a':acc;cx.beginPath();cx.ellipse(x+Math.cos(a)*6,y+Math.sin(a)*6,6,3,a,0,TAU);cx.fill()}cx.fillStyle='#ffd34a';cx.beginPath();cx.arc(x,y,4+Math.sin(t*5),0,TAU);cx.fill();cx.fillStyle='#140c1c';cx.fillRect(x-1,y-2,2,4)}
 else if(b.id==='sentinel'){const bob=Math.sin(t*2)*2;cx.fillStyle='#140c1c';cx.fillRect(x-15,y-14+bob,30,32);cx.fillStyle=col;cx.fillRect(x-14,y-13+bob,28,30);cx.fillStyle=fl?'#fff':'#8a6a20';cx.fillRect(x-14,y-1+bob,28,3);cx.fillRect(x-14,y+9+bob,28,2);
  cx.fillStyle=fl?'#fff':'#e8c860';cx.fillRect(x-9,y-22+bob,18,11);cx.fillStyle='#140c1c';cx.fillRect(x-7,y-18+bob,14,3);cx.fillStyle=acc;cx.fillRect(x-6+Math.sin(t*2)*3,y-18+bob,4,3);
  for(const s of[-1,1]){const fx=x+s*(22+Math.sin(t*3)*3),fy=y+2+Math.cos(t*3+s)*4;cx.fillStyle='#140c1c';cx.fillRect(fx-6,fy-6,12,12);cx.fillStyle=col;cx.fillRect(fx-5,fy-5,10,10);cx.fillStyle=acc;cx.fillRect(fx-1,fy-1,2,2)}
  if(b.ph){cx.fillStyle=acc;cx.fillRect(x-4,y-8+bob,2,8);cx.fillRect(x+5,y+2+bob,6,2)}}
 else{const g=cx.createRadialGradient(x,y,2,x,y,b.r*2);g.addColorStop(0,'rgba(255,246,200,.6)');g.addColorStop(1,'rgba(255,200,80,0)');cx.fillStyle=g;cx.beginPath();cx.arc(x,y,b.r*2,0,TAU);cx.fill();
  const pts=8,ro=b.r+Math.sin(t*4)*2;cx.fillStyle=fl?'#fff':b.ph>1?'#ffb0a0':col;cx.beginPath();for(let i=0;i<pts*2;i++){const a=t*.8+i/(pts*2)*TAU,r=i%2?ro*.45:ro;cx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r)}cx.fill();
  cx.fillStyle=acc;cx.beginPath();cx.arc(x,y,6,0,TAU);cx.fill();cx.fillStyle='#fff';cx.beginPath();cx.arc(x,y,3,0,TAU);cx.fill();for(let i=0;i<5;i++){const a=-t*2+i/5*TAU;cx.fillStyle='#fff6a0';cx.fillRect(x+Math.cos(a)*(b.r+8)-1,y+Math.sin(a)*(b.r+8)-1,2,2)}}
 cx.globalAlpha=1}
function drawProp(p){const t=gtime;
 if(p.k==='chest'){cx.fillStyle='#0004';cx.fillRect(p.x-7,p.y+3,14,3);cx.fillStyle='#140c1c';cx.fillRect(p.x-7,p.y-8,14,12);cx.fillStyle=p.last?'#c83a8a':'#8a5a2a';cx.fillRect(p.x-6,p.y-7,12,10);cx.fillStyle='#ffd34a';cx.fillRect(p.x-6,p.y-4,12,1);cx.fillRect(p.x-1,p.y-5,2,3);if(Math.sin(t*3)>.7){cx.fillStyle='#fff';cx.fillRect(p.x+3,p.y-9,1,1)}}
 else if(p.k==='exit'||p.k==='portal'){for(let i=0;i<3;i++){cx.strokeStyle=['#7af0ff','#c07aff','#fff6a0'][i];cx.lineWidth=1;cx.beginPath();cx.ellipse(p.x,p.y-4,7+i*2+Math.sin(t*3+i),10+i*2,0,t*2+i,t*2+i+4.5);cx.stroke()}}
 else if(p.k==='lore'){cx.fillStyle='#140c1c';cx.fillRect(p.x-5,p.y-12,10,14);cx.fillStyle='#7a7a8a';cx.fillRect(p.x-4,p.y-11,8,12);cx.fillStyle='#7af0ff';cx.fillRect(p.x-2,p.y-8,4,1);cx.fillRect(p.x-2,p.y-5,3,1)}
 else if(p.k==='glow'){const g=.6+Math.sin(t*4+p.x)*.3;cx.fillStyle='rgba(120,255,210,'+g*.3+')';cx.beginPath();cx.arc(p.x,p.y-3,7,0,TAU);cx.fill();cx.fillStyle='#e8f0d0';cx.fillRect(p.x-1,p.y-3,2,4);cx.fillStyle='#5affc8';cx.fillRect(p.x-3,p.y-5,6,2);cx.fillRect(p.x-2,p.y-6,4,1)}
 else if(p.k==='pylon'){const on=p.on;cx.fillStyle='#140c1c';cx.fillRect(p.x-5,p.y-22,10,24);cx.fillStyle=on?'#7af0ff':'#4a5a7a';cx.fillRect(p.x-4,p.y-21,8,22);cx.fillStyle=on?'#fff':'#6a7a9a';cx.fillRect(p.x-2,p.y-19,2,14);
  if(p.active){cx.strokeStyle='#7af0ff';cx.lineWidth=2;cx.beginPath();cx.arc(p.x,p.y-10,16,-PI/2,-PI/2+TAU*p.prog);cx.stroke();cx.strokeStyle='rgba(122,240,255,.25)';cx.beginPath();cx.arc(p.x,p.y,40,0,TAU);cx.stroke()}}
 else if(p.k==='fountain'){cx.fillStyle='#fff6';for(let i=0;i<3;i++){const h=(t*30+i*8)%20;cx.fillRect(p.x-1+Math.sin(i)*3,p.y-6-h*.6,2,2)}}}
function drawPickup(k){const b=Math.sin(gtime*5+k.x)*1.5;if(k.k==='gold'){cx.fillStyle='#140c1c';cx.fillRect(k.x-2,k.y-3+b,5,5);cx.fillStyle='#ffd34a';cx.fillRect(k.x-1,k.y-2+b,3,3)}
 else if(k.k==='ore'){cx.fillStyle='#140c1c';cx.fillRect(k.x-3,k.y-4+b,6,6);cx.fillStyle='#9cf';cx.fillRect(k.x-2,k.y-3+b,4,4);cx.fillStyle='#fff';cx.fillRect(k.x-1,k.y-3+b,1,1)}
 else if(k.k==='pot'){cx.fillStyle='#140c1c';cx.fillRect(k.x-3,k.y-6+b,6,8);cx.fillStyle='#e33';cx.fillRect(k.x-2,k.y-3+b,4,4);cx.fillStyle='#ddd';cx.fillRect(k.x-1,k.y-5+b,2,2)}
 else if(k.k==='shard'){cx.save();cx.translate(k.x,k.y-8+b);cx.rotate(gtime*2);cx.fillStyle='#fff6a0';cx.beginPath();for(let i=0;i<10;i++){const r=i%2?3:8,a=i/10*TAU;cx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}cx.fill();cx.restore()}
 else{const c=RARITY[k.it.r].c;cx.fillStyle=c+'40';cx.fillRect(k.x-2,k.y-40,4,40);cx.fillStyle=c+'80';cx.fillRect(k.x-1,k.y-30,2,30);cx.drawImage(itemIcon(k.it),Math.round(k.x-8),Math.round(k.y-14+b))}}
