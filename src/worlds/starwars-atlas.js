/* Ascandir InteractiveMap – Galaxie-Atlas (Star Wars)
   Systemverzeichnis mit Rasterfeld, Region und Sektor aus dem offiziellen
   Star-Wars-Galaxy-Map-Gazetteer (Lucasfilm/starwars.com), nur als Faktenliste
   übernommen: Name | Sektor | Regionscode | Rasterfeld. Keine Grafiken.
   Positionen innerhalb eines Rasterfelds sind gestreut und daher angenähert. */
(function (root) {
  'use strict';
  const DATA = `
5251977|Quence|or|P18
23 Mere||cl|M13
2GS-91E20||co|M11
A-Foroon|Arkanis|or|R16
Aaeton||co|K9
Aakaash|Oplovis|or|M5
Aaloth|Gaulus|or|S17
Aar|Nijune|or|N5
Aargau||co|L10
Aargonar|Perkell|mr|Q7
Aaris|Kathol|or|M21
Aaron|Tharin|or|S8
Ab Dalis|Gaulus|or|R17
Ab'Bshingh|Sujimis|or|O19
Abaarian Abaar||mr|K7
Abafar|Quelii|or|O6
Abar|Tragan Cluster|or|N5
Abbaji|Zuma (Spar)|or|H16
Abecederia|Noolian|mr|Q13
Abednedo||cl|N12
Abelor|Yushan|mr|K17
Abersyn|Cyrillian Protectorate|ex|O12
Abhean|Maldrood|mr|R7
Abo Dreth|Corporate Sector|or|S3
Abonshee|Fakir|cl|K9
Abraxas|Yushan|mr|K17
Abraxin|Tion Hegemony|or|S6
Abregado||co|K13
Abridon|Koradin|or|J18
Abrihom|Rayter|or|J19
Abrion Major|Abrion|or|S15
Absanz|Allied Tion|or|S6
Absit|Tunka|or|I19
Abtin|Danjar|or|N19
Abyss|Ash Worlds|or|S7
Ac'fren|Calaron|or|T9
Acachla||cl|N10
Achillea|Tapani|cl|L13
Acomber||cl|M9
Actlyon|Jjannex|or|K19
Adalog|Mytaranor|mr|Q10
Adamastor||co|L9
Adana||dc|L10
Adari Adari||ir|M9
Adarlon|Minos Cluster|or|M20
Adelphi|Kibilini|or|P17
Adikaria||co|K12
Adim Adari||ir|M9
Adin|Lostar|ex|M7
Adinax Nebula|Semagi|mr|I16
Adner Yataga||ex|N16
Adoris|Senex|mr|L17
Adras|Seswenna|or|M17
Adratharpe||mr|H15
Adrathorpe||ws|H11
Aduba|Bheriz|or|U11
Adumar||ws|J6
Aefao|Corosi|or|N5
Aeneid|Kessel|or|T10
Aeos|Chopani|or|M3
Aesolian||ws|I15
Aestilan|Demetras|or|P7
Aeten||ws|J6
Affa||ir|M13
Affadar|Fellwe|ex|L8
Affavan||hs|S12
Agamar|Lahara|or|M5
Agaris||ws|G14
Agash|Great Agash|ex|K15
Aggarda|Metatessu|mr|R10
Agoliba-Tu|Veragi|or|K3
Agomar|Seswenna|or|M18
Agon|Ash Worlds|or|T7
Agora|Sluis|or|M19
Agridorn||cl|N12
Agriworld-2079|M'shinni|mr|L7
Aguarl|Mbandamonte|ex|N15
Ahakista|Myto|or|K3
Ahch-To||ur|F13
Ahn Krantarium|Esuain|mr|P7
Ai'ken|Prime|ir|O10
Aida|Aida|mr|Q13
Aikhibba|Fei Hu|mr|P13
Ailon||ir|N12
Aiqin|Airam|or|L20
Ajan Kloss|Cademimu|or|L5
Ak-Hurst|Tarabba|or|M19
Akiva|Meerian|or|O6
Akkadese Maelstrom|Kessel|or|T10
Aklasian Nebula|Kastolar|mr|R10
Akrit'tar|Calaron|or|T9
Akuria|Oplovis|or|M5
Al'doleem|Hune|mr|Q12
Alabash|Fakir|cl|K9
Alagon|Tennuutta|mr|Q7
Alakatha|Var Hagen|mr|M16
Alamass|Calaron|or|T9
Alarevi|Gaulus|or|S17
Alashan||ws|J5
Alaspin|Suolriep|or|S8
Alassa Major|Vilonis|mr|O16
Alba|Belsmuth|or|O6
Albarrio|Albarrio|or|K5
Albecus||co|L9
Albrae-Don|Sern|cl|L13
Alchenaut|Alchenaut|ex|L16
Alderaan|Alderaan|co|M10
Alderath|Alderath|mr|L7
Alderbathe|Churnis|mr|J6
Aldereen||ir|M14
Aldhani|Cademimu|or|M6
Aldin|Aldino|mr|J17
Aldivy|Illisurevimurasi|or|Q4
Aldo Spach|Jospro|or|S7
Aldraig|Alderaan|co|M10
Alee||hs|R9
Aleen|Bright Jewel|mr|L7
Aleen|Minor|ir|M13
Aleron|Tapani|cl|L13
Alfestril||ir|N12
Algara|Lambda|mr|P15
Algarian|Dufilvian|mr|Q15
Algarra|Thrasybule|or|P6
Algnadesh|Hapes Cluster|ir|O9
Algor|Cronese Mandate|or|S6
Algunnis|Trax|mr|Q10
Alion||ir|L14
Alios|Rachuk|cl|N11
Alis Point|Tamarin|or|N18
Alisandor|Tapani|cl|L13
Alk'Lellish|Sumitra|ex|N7
Alkenak||co|M12
Alland||co|K10
Allandor|Tapani|cl|L13
Allanteen|Tynna|ex|O14
Allard|Svivreni|or|O19
Alliga|Phelleem|or|S7
Allst Prime|Taldot|mr|Q8
Alluuvia|Elrood|or|M19
Allyuen|Javin (Anoat)|or|K18
Almagest,|The|ir|J13
Almak Almak||mr|J17
Almakar||ir|N9
Almania|Mortex (Almanian)|or|S5
Almar|Elrood|or|M19
Almera||ir|M8
Alnaria||cl|J9
Aloxl||dc|L10
Aloxor|Kontahr|mr|R11
Alpheridies|Farstey|ex|O8
Alphoresis|Grumani|or|M17
Alpinn|Kanz|or|N4
Alsakan Alsaka||co|L9
Altair|Thrasybule|or|P6
Altano|Piryn Shar|ex|K16
Altarrn|Glythe|mr|J7
Altawar|Corellian|co|M11
Althir|Rolion|or|P6
Altier|Altier|ex|O13
Altikar|Toblain|or|O18
Altooni|Corellian|co|M11
Altor|Zoraster|or|U13
Altora|Dalonbian|or|L3
Altratonne|Ash Worlds|or|S7
Altunna|Cassander|or|K5
Altyr|Morshdine|or|O5
Aludia|Trilon|or|H16
Alui|Alui|mr|O17
Alun|Oriolan|mr|J16
Alurion|Raioballo|or|L4
Alvadorjia|Andirma|ex|L15
Alvorine|Yminis|or|S14
Alzar|Thanium|or|R6
Alzoc|Sujimis|or|P19
Amaltanna|Kanz|or|N4
Amar|Airon|ir|O10
Amarin|Allied Tion|or|S6
Amaxine Station|Tunka|or|J19
Ambria|Airon|ir|O10
Amethia|Prime|ir|L14
Amfar||ir|O8
Amloch|Rayter|or|J19
Ammon|Ciutric|or|N5
Ammuud|Corporate Sector|or|S4
Amorphiia|Eidoloni|mr|L16
Amorris|Quelii|or|O6
Ampliquen|Meridian|or|R7
Anadeen||ir|O9
Anantapar|Javin (Yarith)|or|K18
Anarak|Wyl|or|R4
Anaxes|Antemeridian|or|R7
Ancathia|Albarrio|or|K5
Anchoron|Mayagil|or|M18
Andalia|Hapes Cluster|ir|O9
Andara||co|L13
Andasala|Cor'ric|or|P18
Andelm|Svivreni|or|O19
Ando|Lambda|mr|Q15
Andooweel|Arkanis|or|R16
Andosha|Lambda|mr|P15
Andraven|Wazta|or|J18
Andulia|Doldur|mr|P15
Andurkoss|Nouane|ir|N8
Anduvia|Immalia|ex|K8
Anelsana|Farstey|ex|O8
Anemcoro|Albarrio|or|K5
Anga|Sarka|mr|Q8
Angcord||ir|I13
Angeria|Venaarian|mr|O8
Angor|Myto|or|K4
Angrallia|Fath|or|K6
Angratha|Senex|mr|L18
Anic|Xan|mr|Q15
Ank Ki'Shor|Indrexu|or|S5
Ank Kit'aar|Druess|mr|O15
Ankhural||hs|R9
Ankori|Kossa|ex|P10
Ankot Station|Brema|or|M17
Ankus||mr|I7
Annaj|Zuma (Moddell)|or|H16
Annamar|Bes Ber Bikade|ex|L15
Annoo|Tharin|or|S8
Anoat|Javin (Anoat)|or|K18
Anobis|Bright Jewel|mr|L7
Anorelga|Braxant|or|K3
Anoth||ws|J20
Ansarra|Iskin|mr|O16
Ansata||co|M11
Ansek|Eidoloni|mr|M17
Ansillivog|Majoor|ex|N15
Ansion|Churnis|mr|I6
Anstares|Juvex|mr|L17
Antakaria|Bothan|mr|R14
Antamont|Meridian|or|R6
Antar||ir|N12
Antared|Esstran|or|Q4
Antares||ir|N12
Anteevy|Esuain|mr|P7
Antemeridias|Antemeridian|or|R7
Anthan|Braxant|or|K3
Anthus|Brema|or|M17
Antillion|D'Astan|or|O6
Antine||or|I19
Antipose|Centrality|or|U8
Antiquity|Senex|mr|L18
Antmuel|Chopani|or|M3
Anto's Star|Saijo|or|K20
Antolus|Sarka|mr|Q8
Anturus|Senex|mr|L18
Anukara|Prackla|ex|O8
Anx Minor|Raioballo|or|L4
Anzat|Bryx|mr|R7
Anzell|Bryx|mr|R7
Aostai||ws|I13
Apatros|Savareen|or|Q16
Apgar|Hilo|ex|O13
Aphran||ir|K8
Apiliria||ws|T5
Aplooine|Grumani|or|N17
Apoka|Dohlbani|mr|R14
Aq Vetina|Relgim|or|M4
Aquaris|Sumitra|ex|N7
Aquella|Senex|mr|L17
Aquilae||cl|N12
Aquilaris|Sanbra|or|O17
Aquilaris Minor|Grumani|or|M17
Arabanth|Hapes Cluster|ir|O9
Aradia||co|K10
Arah|Dantus|or|J6
Arakein||ir|N8
Aralia|Antemeridian|or|R7
Aramal Ryborean||ex|J8
Aramand|Brak|ex|O14
Aramanoo|Bheriz|or|U10
Arami|Galov|or|T13
Arantara|Daimar|mr|Q16
Arapia|Dalchon|or|R18
Arashar||ir|J8
Arat Fraca||cl|M12
Arath|Tunka|or|J19
Arbiflux|Dalonbian|or|L3
Arbooine|Arboo|or|T17
Arbra|Bon'nyuw-Luq|or|N17
Arbular|Lambda|mr|Q15
Arc of Eden|Immalia|ex|K8
Arcadi||ir|N10
Arcan|Cronese Mandate|or|S6
Arcana|Lahara|or|M5
Archae Teuthis|Brevost|ex|O14
Archais|Hapes Cluster|ir|O9
Archenar|Metatessu|mr|R10
Archeon Nebula|Lothal|or|T7
Arcopola|Spadja|or|Q5
Arcura||ir|L8
Arda|Gordian Reach|or|Q6
Ardennia|Fath|or|K6
Ardis||ur|G3
Ardroxia|Elochar|mr|R9
Ardru|Iseno|ir|N13
Argai|Cronese Mandate|or|S6
Argai Minor|Haldeen|cl|M9
Argavat||cl|J13
Argazda|Kanz|or|N4
Argo|Tragan Cluster|or|N5
Argoba|Trilon|or|H15
Argoon|Tion Hegemony|or|S6
Argovia|Endocray|mr|S14
Argul|D'Aelgoth|mr|L17
Argus|Lambda|mr|P16
Aria|Prime|ir|O9
Ariarch-17|Ariarch|mr|J6
Aricho|Danjar (Siannach)|or|N18
Aridinia||ir|M13
Aridka|Hertae|mr|Q14
Aridus|Narvath|ex|O14
Arieli|Authala|ex|P12
Aris|Albarrio|or|K5
Aris Minor|Parmel|or|O18
Arkam||ir|M14
Arkania||cl|M8
Arkanis|Arkanis|or|R17
Arkax|Station|ir|M14
Arkinnea|Axion|ex|P10
Arkonne|Tarabba|or|M19
Arkuda|Gordian Reach|or|Q6
Arleen|Centrality|or|T8
Arli|Mayagil|or|N18
Armath|Mikaster|ex|N15
Arnot Station|Far Xandil|mr|P16
Arnt||ir|N8
Arorua|Sertar|or|R5
Arporatal-Lanin|Juvex|mr|K18
Arquata Station|Bes Ber Bikade|ex|L15
Arrakan|Kalamith|or|P5
Arramanx|Cronese Mandate|or|S6
Arreyel||ir|M14
Arrgaw|Kira|ex|N16
Arrochar||hs|S8
Arron Prime|Cassander|or|L5
Arsteni||cl|L8
Artemesium|Lifh|mr|R8
Artesia|Hangshan|ex|P11
Arthon|Ottega|mr|L6
Arthuria|Merthian|ex|N14
Artiod Minor Morellian CW*||ws|S3
Artom|Nuon e Safyd|ex|P12
Artorias|Myto|or|K3
Artus Prime|Kwymar|or|Q4
Aruza||ex|I14
Arvaka|Prime|ir|N9
Arvala|Sevetta|or|S15
Arveesh Station|Eclorar|mr|Q12
Arvina|Quiberon|or|S15
Arzid|Calaron|or|T9
Asamin|Strabin|mr|M7
Asation|Veragi (Gree Enclave)|or|K3
Ash Moon 1|Jubilar (Kartovian)|or|T7
Ashas Ree|Esstran (Sith Worlds)|or|R5
Ashas Rine|Mortex|or|R5
Ashash|Zarracina|ex|N14
Asher|Sprizen|or|N5
Asheris Tagge|Space|co|L9
Ashkas-kov|Shelsha|cl|M9
Ashteri's Cloud|Kessel|or|T10
Askaj|Cegul|or|M20
Askaria|Askarian|ex|P12
Askkto-Fen||ws|P19
Asmall Ara Dyelle||ir|O9
Asmeru|Senex|mr|L17
Asog|Esstran|or|Q4
Asran|Brak|ex|O14
Asrat||ir|N8
Ast Kikorie|Zuma (Moddell)|or|H16
Astenban|Seswenna|or|M18
Asteph'skaff||ws|I6
Asterios|Narrant|mr|I16
Asternin|Tamarin|or|N19
Astrali|Var Hagen|mr|M16
Asturias|Epsi Collective|ex|M16
Asuin||hs|S11
Asusto|Gordian Reach|or|P5
Asyrphus|Perkell|mr|Q7
At Attin|Quelii|or|N6
At Aytuu|Trilon|or|G15
Atalia|Varada|or|H19
Atanu|Alderath|mr|L7
Atapap||ir|N12
Atchorb|Corporate Sector|or|S3
Athallia Athallia||ex|M15
Athamar|Hewett|mr|M7
Ather|Atravis|or|L20
Athio|Mayagil|or|N18
Athiss|Esstran (Sith Worlds)|or|R4
Athus Klee|Kalamith|or|P5
Atoa|Ghost Nebula|ex|P10
Atollon|Lothal|or|T7
Ator||co|M10
Atorra|Gordian Reach|or|Q5
Atraken|Rolion|or|Q7
Atrakus|Mikaster|ex|M15
Atravis|Atravis|or|L19
Atron|Senex|mr|L18
Attahox|Hocatar|ex|P12
Atterol|Atravis|or|L19
Atterra|Kanz|or|N4
Aturi Cluster|Hook Nebula|or|O18
Atzerri||ir|M13
Aubadas|Tunka|or|I19
Aur||cl|J13
Auratera|Vorzyd|or|R6
Aurea|Corellian|co|M11
Auril|Auril|or|R6
Aurimaus||ws|I16
Austan|Arkanis|or|R16
Avedot||cl|L8
Avenel||ir|O8
Avenelle|Lantillian|mr|P9
Averam|Seswenna|or|M18
Averill|Teraab|mr|P11
Avernio||ur|G5
Avery|Belderone|or|R6
Avidich|Chiss Space|ur|E8
Aviles Prime|Hythrope|ex|M15
Awalia|Raioballo|or|L4
AX-456|Barma|cl|M9
Axion|Axion|ex|P10
Axtria||co|L9
Axxila|D'Astan|or|O5
Aybaria|Steniplis|or|L19
Ayceezee|Kanz|or|N4
Aylayl||hs|S12
Aynaboni||or|J5
Ayoh|Phelleem|or|S7
Azbrian||co|L12
Azna|Demetras|or|P6
Aztubek|Javin|or|K18
Azum|Itopol|ex|K15
Azura|Oricho|or|M6
Azure|Truum|mr|P8
Azzameen|Station Garis|or|N17
B-Foroon|Arkanis|or|R16
B'Knos||ws|G16
B'nish|Tharin|or|S8
B'trilla|Gordian Reach|or|Q5
Baarstal|Sanbra|or|N17
Babali|Corva|or|P3
Babbadod||ir|N14
Bacia||ir|M14
Bacrana|Brak|ex|O14
Bactriasa||ir|O10
Badfellow|Station|co|M10
Badtibira||co|K12
Baes Logia|Quence|or|O18
Baffia||dc|L12
Baffop|Tamarin|or|O19
Bahalian|Astal|or|P18
Bahlah|Thesme|or|O6
Bajic|Bajic|or|P18
Bakisian Drift|Tragan Cluster|or|N5
Bakkah|Thrasybule|or|P6
Baklek||ir|N12
Bakura||ws|G16
Bal'demnic|Auril|or|R7
Balagash|Hali|ex|O9
Balaidas||cl|L8
Balamak|Taldot|mr|Q9
Balanor|Noonian|or|M6
Balaria||co|M12
Baldavia|Hapes Cluster|ir|O9
Baldur|Nojic|ex|P9
Balfron|Dolomar|co|K9
Balis-Baurgh|Sombure|mr|K16
Balith||ir|N7
Balli|Abrion|or|S15
Ballum|Kastolar|mr|Q10
Balmorra||cl|M10
Balnab|Bright Jewel|mr|L7
Balosar||co|L12
Balowa|Daalang|mr|Q12
Baltimn|Chorlian|or|S4
Baltizaar|Corthenia|mr|K7
Baltro|Onatos|mr|R15
Bamasia||ir|N9
Bamayar|Maldrood|mr|R7
Bampa'k|Prefsbelt|or|K5
Ban-Satir|Corporate Sector|or|S4
Banas|Sanbra|or|O17
Banasthau||ir|O11
Bancar|Rayter|or|J19
Banchii|Jjannex|or|K19
Bandomeer|Meerian|or|O6
Bandonia||co|L10
Bandorra||cl|N10
Banfoden Prime|Alchenaut|ex|L16
Bannistar Station|Hevvrol|mr|O15
Bantoo|Samix|or|Q19
Bantu|Emmo|co|M12
Banvhar Station|Kriz|or|J18
Bar Neth|Albarrio|or|K5
Bar'leth||co|M10
Baraan-Fa|Grumani|or|N17
Barab|Albanin|or|U12
Barabaras||mr|J15
Barabesh||mr|I16
Baraboo||co|M11
Baradas||cl|L8
Baralou|Varada|or|H20
Baramorra|Carrion|or|J4
Barancar|Cronese Mandate|or|S6
Barayfe|Alchenaut|ex|L16
Barbadel||co|K13
Barbeen||dc|L10
Barcaria|Sombure|mr|K16
Barcola||cl|N10
Bardelberan|Churnis|mr|J6
Bardotta Shasos||cl|K13
Bardram Scoft||ur|D7
Barenth|Drannik|ex|K8
Barison|Gordian Reach|or|Q6
Barkhesh|Seitia|or|K19
Barlok Marcol||ir|L8
Barnaba|Tapani|cl|L13
Barnahof|Yminis|or|S14
Baroli|Baroli|ex|N14
Baroonda|Calaron|or|T9
Baros|Lothal|or|U7
Barpine|Weneen|or|N6
Barraken|Varada|or|H19
Barroth|Kriz|or|K19
Bars Barka|Barsa|mr|J6
Barseg|Allied Tion|or|S6
Bartokan|Tamarin|or|N19
Barton|Colundra|or|S5
Barundi|Thanium|or|S5
Basan|Churba|mr|P15
Basarais|Kossa|ex|O11
Basath||cl|J13
Basilisk||co|L9
Baskarn|Noonian|or|M6
Baskron|Trax|mr|Q10
Bassadro||cl|L13
Bassel||ir|N13
Basta Core|Wyl|or|R4
Bastatha||ir|N10
Basteel|Corva|or|P3
Bastion|Braxant|or|K3
Bastooine|Graador|mr|I17
Bathoris||ir|N8
Batonn Ash|Worlds (Batonn)|or|T7
Bator Bai|Senex|mr|L18
Batorine||cl|J9
Batravia|Serathrace|ex|P11
Batuu|Trilon|or|G15
Batuv|Askarian|ex|P12
Baummu|Shadola|or|U8
Bavana|Sertar|or|R5
Bavva|Javin (Anoat)|or|K18
Baylagon||co|M10
Baylin Cluster|Trans-Nebular|mr|R16
Bayora|Extorin|ex|J15
Bazaar|Halthor|or|M6
Bazarre|Cademimu|or|M6
Beauchen|Vensori|mr|P8
Beckoning Call Starr||ir|O10
Bedlam|Thusa|mr|O7
Bedlam Pulsar|Thusa|mr|O7
Beetle Nebula|Bon'nyuw-Luq|or|N18
Begali||ir|M8
Begamor|Lahara|or|M5
Begeren|Esstran (Sith Worlds)|or|R4
Beheboth|Sanbra|or|O17
Beixander||mr|H15
Belasco|Belasco|ex|O11
Belassar Sarla||ex|J8
Belat|Vilonis|mr|O16
Belazura||cl|M13
Belderone|Belderone|or|R6
Beledeen||cl|K13
Belgaroth||co|K13
Belial|Sanbra|or|N17
Belkadan|Dalonbian|or|L1
Belladoon|Myto|or|K3
Bellassa||co|M11
Bellis|Demetras|or|P7
Belloria|Seswenna|or|M18
Belnar Belnar||cl|M9
Belovia|Ombakond|ex|P12
Belsavis|Bozhnee|or|L18
Belshar Othacuu|Belshar|mr|J7
Belsmuth|Belsmuth|or|O6
Belthu|Demetras|or|O7
Beltire|Narrant|mr|J17
Beltrix||ir|M14
Belukat|Corpheli|ex|M7
Belvaria|Corweillian|mr|P15
Benath||ws|I7
Bendeluum|Javin (Anoat)|or|K18
Bendii|Seitia|or|K19
Bendone|Bosph|or|R3
Benetage|Thanium|or|R6
Bengat||ir|J8
Bengely|Tamarin|or|N19
Benglor|Onatos|mr|R15
Benja-Rihn|Sevastol|mr|Q14
Benkal||ws|H17
Bentora|Samix|or|Q19
Benwabula|Shadola|or|U7
Ber de Val||cl|M9
Berason|Eclorar|mr|Q12
Berchest Anthos||ir|N8
Berea|Elrood|or|M19
Beris|Fei Hu|mr|Q13
Bernilla||ir|L14
Beroq|Baroli|ex|N14
Berri||ir|N9
Berrol's Donn|Kriz|or|K19
Berrun||cl|M10
Berullia|Quence|or|O18
Berzite||ws|U8
Bes|Airam|or|M20
Besberra|Cegul|or|L20
Bescane|Obtrexta|or|K3
Besero||dc|L10
Beshka|Aparo|or|R3
Besn|Mayagil|or|N18
Besnia||cl|N12
Bespin|Javin (Anoat)|or|K18
Bessimir||co|L9
Bestal|Varada|or|I19
Bestine||ir|M14
Bestoon||cl|J9
Beta Olikark|Wyl|or|S4
Beta Rhama|Dalchon|or|R17
Betal||ws|J5
Betha|Corva|or|P4
Bethal|Tapani|cl|L13
Bethars|Emmo|co|M12
Betolio|Tapani|cl|L13
Betshish|Gordian Reach|or|P5
Bettel|Javin (Yarith)|or|K18
Betthanie|Wornal|mr|K16
Bettok|Velcar|or|J4
Bevell||ir|L8
Bevin|Rolion|or|Q6
Bextar|Velcar|or|J4
Bezha||cl|N10
Bezim|Vorc|mr|J7
Beznaz|Quiberon|or|T15
Bhargebba|Esstran (Sith Worlds)|or|R4
Bheriz|Bheriz|or|U10
Bhuna Sound|Yushan|mr|K17
Bianas|Tapani|cl|L13
Bid'jerma|Prefsbelt|or|J5
Biewa|Corporate Sector|or|S4
Biitu|Cassander (Tadrin)|or|K5
Biivren Biivren||ex|P9
Bilbringi||ir|J8
Bilios|Tapani|cl|L13
Billaron|Chitarghar|ex|K15
Bilzen||ws|U12
Bimin Three|Majoor|ex|N15
Bimmiel|Kanz|or|N4
Bimmisaari|Halla|mr|R9
Binaros|Kathol|or|M21
Binquaros|Ciutric|or|N5
Biravia|Venaarian|mr|O7
Birba||dc|M10
Birgis|Dalonbian|or|M3
Birix|Bryx|mr|R8
Birjis|Dalchon|or|R17
Birren||ir|O10
Birsingrial||co|L10
Birukay|Gardaji|or|M1
Bisellia|Clacis|or|K4
Biskar||ir|K14
Bissillirus|Trax|mr|Q10
Bith||co|L13
Bitmus Cloud|Wazta|or|J18
Bittelari Cluster|Fath|or|K6
Bivoli||ir|L15
Bizikia|Kwymar|or|P4
Black Bantha||ir|K8
Black Delve, The|Har Worlds|ex|J16
Black Hole of Nakat||ir|N7
Black Hole of Quintas|Kriz|or|J19
Black|Nebula|cl|M12
Black Widow Nebula|Calaron|or|T9
Blackfel|Greater Plooriod|ex|M7
Blacktar Cyst|Oktos|mr|R12
Blair Cluster|Airam|or|L20
Blarrum|Mayagil|or|N18
Blathar|Yucrales|mr|R15
Blenjeel|Dufilvian|mr|Q15
Bleuf||co|L13
Blimph|Kastolar|mr|Q10
Blood Nest|Halori|mr|P7
Bloxia||ws|I7
Blutopia|Vensensor|ex|K16
Blyte|Tapani|cl|L13
Bnach|Calaron|or|T9
Bnar|Braxant|or|K3
Boden|Videnda|or|M18
Bodoria|Andirma|ex|L15
Bodrin|Elrood|or|M20
Bofa|Steniplis|or|M18
Bogano|Mieru'kar|or|N3
Bogden||ir|M8
Bogo Rai||ur|E8
Bogoa|Immerian Outback|ex|N14
Boiyuh||cl|J9
Bolad|Tharin|or|S8
Bolbotarp|Corellian|co|M11
Boldavia||ex|I9
Boledge||ir|N12
Bolenia||co|K9
Boltiga||cl|M13
Boltrunia|Baxel|or|U11
Bomis Koori|Wornal|mr|K16
Bomodon|Churba|mr|O15
Bompreil|Demetras|or|P7
Bonadan|Corporate Sector|or|S3
Boneworld, The|Toblain|or|N18
Bontormia|Bortele|mr|R8
Boonta|Suolriep|or|S8
Boordii|Sumitra|ex|N7
Boosodia||ir|N8
Bootana Shagplan||hs|S10
Boothi|Abrion|or|S15
Boranall|Doldur|mr|P15
Boranda|Manda|mr|R14
Borao||ir|M14
Borcorash|Weneen|or|N6
Borga|Yminis|or|S14
Boriin||ir|N14
Borkeen|Belsmuth|or|O6
Borkyne|Bes Ber Bikade|ex|L15
Borlax|Jidlor Marches|mr|J16
Borleias||cl|K9
Borloria|Dentari|ex|O8
Borlov|Tunka|or|J19
Bormea|Bormea|co|L9
Bormter||ws|H14
Bormus|Dustig|mr|N16
Boro-borosa|Senex|mr|L18
Bororn|Rseik|or|N20
Borosk|Prefsbelt|or|K5
Bortele Cluster|Bortele|mr|R8
Bortras|Brema (Reithcas)|or|M18
Boruga||co|L10
Bos-Una||ir|J14
Bosch||co|K10
Bosph|Bosph|or|Q3
Bosthirda|Esstran (Sith Worlds)|or|R5
Botajef|Belsmuth|or|O6
Bothawui|Bothan|mr|R14
Bothsoliman|Hollan|mr|M7
Botor Botor Enclave||co|K12
Boudolayz||cl|N12
Bovo Yagen|Kailion|ex|O13
Bowane Nebula|Tungra (Fand)|or|K18
Boxer Point Station|Prackla|ex|O8
Boz Pity|Halla|mr|S9
Boztrok|Aparo|or|R3
Bpfassh|Sluis|or|M19
Bracca|Lantillian|mr|P9
Braccio||ws|I5
Brachi|Sertar|or|R5
Brachnis|Chorios Meridian|or|R7
Brackna|Doldur|mr|P15
Bracront|Tarabba|or|M19
Bragkis|Belderone|or|R6
Bramior||ir|M9
Branteez|Tolonda|or|Q17
Brask Oto||ur|H7
Bravais||ir|O9
Bravis|Spadja|or|R5
Bray|Piryn Shar|ex|K16
Breeka|Cadavine|or|P17
Brella Temior|Barma|cl|M9
Brendok||ws|Q2
Brentaal|Bormea|co|L9
Bresallis|Cadma|or|T8
Bresan|Kathol|or|M21
Breshig|Mandalore|or|O7
Breshkall|Khuiumin|or|O19
Bresnia|Tandon|mr|Q14
Breta Yaga|Mieru'kar|or|O3
Bretta|Ojoster|or|N7
Brevost|Brevost|ex|O15
Bri'ahl|Bri'ahl|or|I17
Bri'n|Lothal|or|U7
Bridin Anchorage|Portmoak|or|P18
Brield||cl|M12
Brightday||ir|K8
Brigia|Tion Hegemony|or|T6
Brink|Station|ws|O3
Brint-wo|Koradin|or|I18
Brintooin|Seswenna|or|M18
Briston|Shelsha|cl|M9
Britaxis|Minor|ir|O11
Brix||cl|N10
Brochiib|Trianii Space|ws|S3
Brodo Asogi|Perinn|or|J4
Brodogon|Bozhnee|or|L18
Broest||co|L10
Brolsam|Kathol|or|M21
Bromlarch|Vish|mr|O16
Bronsoon|Gordian Reach|or|P6
Bront|Svivreni|or|O19
Brosi|Corporate Sector|or|S3
Brunet|Prefsbelt|or|J5
Bruvia Harron|Marches|ex|P11
Bryexx Varvenna||cl|M13
Bryndar|Dalicron|or|K19
Brynnaria||ir|O9
Bryx|Bryx|mr|R8
Bseto|Msst|mr|P7
Buamlon Central|Esstran|or|Q4
Bubble of the Lost||ws|O3
Buchich|Calamari|or|U6
Budpock|Meridian|or|R7
Bulano||co|M10
Bundil|Ferra|or|S16
Bundim|Trax|mr|Q10
Bunduki|Pacanth Reach|or|H16
Bunka|Illisurevimurasi|or|Q4
Buoyant||ir|J14
Burna|Cademimu|or|L6
Burnin Konn|Javin (Anoat)|or|K18
Burnsi|Dustig|mr|N16
Bursant|Taldot|mr|Q9
Burska||mr|I7
Bursoll||ws|H17
Burundang|Harron|ex|O11
Buruunin|Atravis|or|L19
Byblos||cl|M12
Byllura|Grumani|or|N17
Bynarria|Lantillian|mr|P8
Byrnum Maw||ir|L8
Byrsym|Paqwepori|mr|P15
Byss||dc|K11
C-Foroon|Arkanis|or|R16
Caamas||co|M9
Caaraz|Stensen|or|H17
Caarimon|Meridian|or|R7
Caarsin Station|Lannik Wilds|mr|R13
Cabarria||cl|M13
Cadannia|Msst|mr|P7
Cademimu|Cademimu|or|M6
Cadinth|Allied Tion|or|S6
Cadma|Centrality|or|T8
Cadomai|Aparo (Catarlo)|or|R3
Cal-Seti|Torranix|co|K10
Calabar||co|L9
Calabosh|Arc d'Stot|ex|K15
Calast|Grohl|or|R16
Calcoraan||ir|O10
Calderos Station|Bryx|mr|R8
Caldoni||co|M12
Caldra Prime|Ado|mr|M17
Caldra Tertius|Ado|mr|M17
Calfa|Hapes Cluster|ir|O9
Calgon|Meridian|or|R7
Caliban|Savareen|or|Q17
Calior|Seitia|or|K20
Calipsa|Tapani|cl|L13
Calladus|Ojoster|or|N7
Calline|Dail|or|Q18
Callonia|Fakir|cl|K9
Callos|Brema|or|M17
Calonica|Vensensor|ex|K16
Caloria|Tapani|cl|L13
Caltinia|Senex|mr|L17
Caltrop Belt|Elrood|or|M20
Calumdarian|Immalia|ex|K8
Calus||ir|L15
Caluula|Tion Hegemony|or|T6
Camaria|Tarabba|or|M19
Camblia||cl|L13
Cambria||dc|L10
Camden|Morshdine|or|O5
Camen|Tamarin|or|N18
Camson|Abrion|or|S15
Camus|Illisurevimurasi|or|Q4
Canastra||co|K10
Candoria||cl|J13
Candovant||cl|N12
Canoliss|Sluis|or|M19
Canti|Tapani|cl|L13
Cantonica|Corporate Sector|or|S4
Cantras Gola|Perinn|or|J4
Cantros|Saijo|or|J20
Canyon|Montitian Grant|ex|J15
Capella|Gordian Reach|or|Q6
Caphexdis|Homon|mr|M7
Caprioril|Dolomar|co|K9
Capza|Velcar|or|K4
Caraad||cl|L8
Caragon-Viner||cl|N12
Carajam|Dalonbian|or|M3
Caramm|Talcene|mr|R8
Caranthanax|Wazta|or|J18
Caraxl|Cassander|or|K5
Carbos|Roche|mr|Q8
Carburo|Itopol|ex|K15
Carcel|Locris|ex|O8
Carconth||co|M11
Cardekkia|Corellian|co|M11
Cardellia|Ojoster|or|N7
Cardo Minor|Meerian|or|O6
Cardogia|Tashtor|mr|J16
Cardooine|Jospro|or|R7
Cardovyte|Oricho|or|M6
Cardua||co|L10
Carest||ir|N8
Cargamalis|Bruanii|mr|K18
Carida||cl|M9
Carlac|Prefsbelt|or|K5
Carlania|Hapes Cluster|ir|O9
Carlem||co|L10
Carlix's Folly|Tharin|or|S8
Carmeen|Altier|ex|O13
Carnelion||ws|J5
Carnovia||hs|S12
Carnth|M'shinni|mr|M7
Carosi|Nembus|or|P4
Carpagia||cl|L9
Carpastor|Rolion|or|Q7
Carrandar Secundus|Portmoak|or|P18
Carratos||ir|K8
Carreras|Atravis|or|L19
Carrivar||ur|G9
Carruthia|D'Astan|or|O6
Carsanza|Juvex|mr|L17
Cartao|Prackla|ex|O8
Carto|Surron|ex|O13
Cartusio||co|J12
Carvandir Carvandir||ex|J7
Carz|Svivreni|or|O20
Casfield|Tennuutta|mr|Q7
Caska||ir|N14
Cassander|Cassander|or|K5
Cassidode|Aparo|or|R3
Castell||cl|M9
Castilon|Tashtor|mr|I16
Cataalda|Onatos|mr|R15
Cataract of Moons|Tungra (Fand)|or|K18
Cathar|Quelii|or|N6
Cathis|Jjannex|or|K19
Catlia|Chiss Space|ur|G8
Cato|Neimoidia Quellor|cl|N11
Cattamascar|Bakura|or|G16
Caulbon||ir|L14
Cauldron|Nebula Corva|or|P3
Caulus Tertius||ir|M8
Cauper|Tapani|cl|L13
Caursito||cl|K8
Cavaell|Emmo|co|M12
Cavamina|Doldur|mr|P15
Caviness|Charra|ex|P14
Cedonne|Dononter|mr|I16
Cedre|Quelii|or|O6
Cedrell|Emmo|co|M12
Cegul|Cegul|or|M20
Ceiran||ir|N14
Ceitia|Bryx|mr|R8
Cejansij|Halla|mr|R9
Cel Amiin Cantons of Lahag||ex|J15
Celanon|D'Astan|or|O6
Celdaru||ws|I8
Celegia|Noori|ex|O10
Celen|Elochar|mr|R9
Celes|Herdessa|mr|Q16
Celestial Wake, The|Kriz|or|K19
Celsor|Hook Nebula|or|O17
Celwis||ur|F8
Centares|Maldrood|mr|R7
Centori|Iskin|mr|O16
Cerberon||dc|L10
Cerea|Semagi|mr|I16
Cerenia|Mbandamonte|ex|N15
Cerifisis|Varada|or|I19
Cerilia|Xappyh|or|Q3
Ceriun|Nuiri|or|Q6
Cermau|Bakura|or|H16
Cerosha|Jospro|or|R7
Cerroban|Bon'nyuw-Luq|or|N18
CeSai|Illisurevimurasi|or|Q4
Cesya|Tapani|cl|L13
Ceti 597|Hollan|mr|M7
Cezith|Clacis|or|K4
Ch'hodos|Esstran (Sith Worlds)|or|R4
Ch'manss|Var Hagen|mr|M17
Ch'zimi'kho|Zeemacht Cluster|ir|N8
Chaaktil||ir|N14
Chaastern|Shelsha|cl|M9
Chabosh|Lahara|or|M5
Chad|Jospro|or|R7
Chadawa|Croynar|ir|N14
Chagar|Khuiumin|or|O19
Chagaria|Danjar|or|N18
Chal Hudda|Garis|or|N17
Chalacta|Metatessu|mr|R10
Chalcedon|Tashtor|mr|I16
Challon||co|L9
Chamble|Mytaranor|mr|Q10
Chamm||co|M12
Champala||ir|L8
Champat||co|M12
Chanceuxi|Kanz|or|N4
Chandaar|Cronese Mandate|or|S6
Chandar's Folly|Saijo|or|J20
Chandel|Ojoster|or|N6
Chandrila|Bormea|co|L9
Changa|Tolonda|or|Q18
Chankin|Jidlor Marches|mr|I16
Chanosant|Harron|ex|O11
Charbodia||ir|N9
Chardaan||ir|N14
Chardis|Trilon|or|H16
Charenthoth||cl|N9
Chargona|Citlik|ex|O15
Charis|Kathol|or|M21
Charissia Bartahn||ir|L15
Charmath|Farrfin|co|K9
Charra|Charra|ex|P14
Charros Numesira||mr|R9
Charubah|Hapes Cluster|ir|O9
Chashima|Auril|or|S6
Chasidron Shoals|Bortele|mr|R8
Chasin||co|M12
Chasmeene||ir|O10
Chateuse|Tungra|or|K19
Chaykin|Chaykin|ex|O14
Chazwa|Orus|ir|N8
Cheedoa||cl|M12
Cheelit|Semagi|mr|I16
Cheeyoom Matee||co|K9
Chekria|Shelsha|cl|M9
Cheku|Brevost|ex|O15
Chelleya|Seswenna|or|M18
Chelloa|Grumani|or|M17
Chemvau||cl|M13
Chenley Prime|Savareen|or|Q17
Chennis|Greater Plooriod|ex|M7
Chenowei|Gordian Reach|or|Q5
Cheravh|Mandalore|or|O7
Cherridan Belnar||cl|M9
Cheruba|Hapes Cluster|ir|O9
Chespea|Rayter (Berenge)|or|J19
Chestrashus||ws|Q3
Chibbier|Stensen|or|I17
Chibias|Sombure|mr|K17
Chiloon Rift||ws|O3
Chiron|Ash Worlds|or|T7
Chirrion|Rolion|or|Q6
Choah|Mortex|or|S5
Choi||ir|M13
Chokan|Maerdocian|mr|Q13
Chol|Nebula|or|T5
Cholganna||or|T5
Chommell Minor|Chommell|mr|O17
Chonsetta|Metatessu|mr|R9
Chorax|Rachuk|cl|N11
Chorgad|Fei Hu|mr|Q13
Chorin||ir|N14
Chorra Bamula||ir|J13
Chortose|Rseik|or|N20
Chosper|Hapes Cluster|ir|O9
Choss||cl|J13
Chrellis|Lahara|or|M5
Chrelythiumn||ws|K2
Chrenthoan Abyss Chrenthoa||ir|J14
Christophsis|Savareen|or|Q16
Chroma Zed|Maerdocian|mr|Q12
Chroman|D'Aelgoth|mr|K17
Chrome Citadel|Harron|ex|O11
Chromovon|Nembus|or|P4
Chrona||ir|O8
Chryya|Dustig|mr|M17
Chundu|Cegul|or|L20
Churr|Quellor|cl|N12
Churruma|Velcar|or|J5
Chuzalla|Tammuz|or|T14
Chyron|Har Worlds|ex|J16
Cianap|Piryn Shar|ex|K16
Ciaox Verith|Croynar|ir|M14
Cificap|Herdessa|mr|Q16
Cilare|Veragi|or|K3
Cilpar||cl|L13
Cimarosa|Irnaj|mr|K17
Cinnabar|Corellian|co|M11
Cioral|Chiss Space|ur|F8
Cioran||co|L12
Ciratu|Immerian Outback|ex|N14
Circarpous|Circarpous|ex|O12
Circumtore||hs|S12
Cirilia|Lannik Space|mr|R13
Cirra|Brak|ex|O14
Cirrus|Dantus|or|J6
Cirtappa|Alui|mr|O17
Cirus|Arkanis|or|R17
Citlik|Citlik|ex|O14
Ciutric|Ciutric|or|N5
Clabron||co|K13
Claer|Sern|cl|L13
Clak'dor|Mayagil|or|M18
Clantaano|Albanin|or|U12
Clar,|The|ws|I20
Clariv|Tion Hegemony|or|S6
Clear View||ws|U13
Clendor||ir|O8
Clerion|Palamut|ex|N13
Cloak of the Sith, The|Abrion|or|S15
Clyne|Corellian|co|M11
Clysm|D'Astan|or|O5
Cmaoli Di|Brema|or|M17
Coachelle|Terr'skiar|mr|P10
Cobal||co|K13
Codia||mr|H15
Cog Hive Seven|Tharin|or|S8
Cole-Haddon|Dalonbian|or|M3
Colla||ir|N9
Collus|Thuldin's Grant|ex|J15
Colonial Station Camco|Chiss Space|ur|F8
Colonial Station Chaf|Chiss Space|ur|F9
Cols|Kastolar|mr|Q10
Colsassa|Jospro|or|R7
Columex|Vorzyd|or|R6
Columus||co|M11
Colunda Prime|Phelleem (Colunda)|or|S7
Comantira|Atravis|or|L19
Cometwash, The|Gordian Reach|or|Q6
Comkin||ir|N7
Commenor||cl|N10
Comra|Prefsbelt|or|J5
Cona Inner|Cluster|ir|O11
Concord Dawn|Mandalore|or|O7
Condular||co|M12
Conjenus|Vish|mr|N16
Constancia||dc|K12
Contruum|Truum|mr|O8
Coonee|Brevost|ex|O15
Coorimbus|Tapani|cl|L13
Copero|Chiss Space|ur|F9
Cophrigin|Ash Worlds|or|T7
Copperline|Vatha|ex|K16
Copul Pallis||ir|N14
Cor I|Tapani|cl|L13
Cor II|Tapani|cl|L13
Cor III|Tapani|cl|L13
Corann||co|M9
Corbantis|Chaykin|ex|O14
Corbett Cluster|Corbett|mr|I17
Corbos|Esstran|or|Q5
Cordes||ir|N9
Cordota|Lantillian|mr|P8
Corellia|Corellian|co|M11
Corfai|Corellian|co|M11
Corg||ws|O20
Coriallis||co|K9
Corips||ir|N14
Corjain|Kathol|or|M21
Corlaasi|Minos Cluster|or|M20
Corlass|Cronese Mandate|or|S6
Corlax|Allied Tion|or|S6
Corlus|Woostri|ex|M16
Cormit|Chiss Space|ur|F8
Cornesia|Manda|mr|R14
Coronar||cl|L9
Corosi|Corosi|or|N6
Corphelion|Corpheli|ex|M7
Corrdair|Hevvrol|mr|O15
Corrida Corridan||co|J10
Corroth||cl|N9
Corsin|Greater Plooriod|ex|M7
Corson Prime|Tharin (Periphery)|or|S8
Corstris|Quelii|or|O6
Cortella||co|K9
Corthenia|Corthenia|mr|K7
Cortilium Major|Eucer|mr|Q7
Cortina||co|K12
Corulag|Bormea|co|L9
Corus|Wyl|or|S4
Coruscant|Corusca (Coruscant)|co|L9
Coruschal||co|K10
Coruscul||co|L10
Corutarn||co|M10
Corva|Corva|or|P4
Corva Yag|Rseik|or|N20
Corvanni Neshig||ir|N9
Corvis Minor|Ciutric|or|N5
Corvus|Cronese Mandate|or|S6
Corweillia|Corweillian|mr|P15
Cosia||dc|M11
Cosmatanic Steppes|Grohl|or|R16
Cotellier|Rseik|or|N20
Coth Fuuras|Deadalis|ex|J8
Coto-Xana||cl|L9
Council|Javin (Anoat)|or|K18
Couronne|Couronne|ex|P10
Cousault|Semagi|mr|I16
Coveway|Koradin|or|I18
Cowl Crucible|Oricho|or|M5
Coxixia||co|M12
Coyerti|Bortele|mr|S8
Coyn|Elrood|or|M20
Craci|Corporate Sector|or|R4
Crait|Bon'nyuw-Luq|or|N17
Crakull||ur|G10
Cranan|Arkanis|or|R16
Crandel||ws|U11
Crash's Drift|Corellian|co|M11
Credaan||ir|M14
Crella|Tapani|cl|L13
Cridark|Baroli|ex|N15
Criigo|Ash Worlds|or|T7
Crintlia|Outer Jalor|mr|I7
Crispin||ws|S3
Critoki|Esstran|or|Q4
Criton's Point|Myto|or|K3
Critonia||mr|I15
Cro-Akon|Thuldin's Grant|ex|J15
Croce|Yminis|or|S14
Croluthe Zenj|Lannik Space|mr|R13
Crombach Nebula|Belsmuth|or|O6
Cron Drift|Auril|or|R6
Crondre|Dufilvian|mr|R15
Crossing Lanes Station|D'Astan|or|O5
Crothy|Seitia|or|K19
Crovna|Senex|mr|L17
Croyden||ir|M13
Crseih|Pakuuni|or|T6
Crucival|Tion Hegemony|or|S6
Crul|Lannik Wilds|mr|R13
Crushank Nebulae|Tantra|or|M19
Crustai||ur|H8
Cryon|Meram|or|O4
Crystal Web Station|Palamut|ex|N13
Crystan||dc|L12
Crytal Nest||ws|H20
Csaus|Chiss Space|ur|F9
Csilla|Chiss Space|ur|F8
Cuirilla|Mbandamonte|ex|N15
Cujicor|Pakuuni|or|T5
Cularin|Thaere|ex|P14
Culroon||ws|P20
Curreck|Sertar|or|R5
Cusver||dc|M12
Cuthbern|Wazta|or|J18
Cuvacia||co|K13
Cuyacan|Sepan|ex|P13
Cvetaen|Sumitra|ex|N7
Cyax||hs|S11
Cybloc|Meridian|or|R7
Cyborrea||hs|S9
Cyclor|Alui|mr|N17
Cyclorria||ir|N9
Cydorria||cl|K13
Cygnus|Kontahr|mr|R11
Cyimarra|Senex|mr|L17
Cymoon|Bes Ber Bikade|ex|L15
Cyphar|Spirva|mr|L17
Cyrillia|Cyrillian Protectorate|ex|O12
Cyrkon|Al'Nasrl|or|T13
CZ-198||ur|H5
Czerialus|Kailion|ex|O13
D'Anjon Nebula|Arkanis|or|R16
D'Assem|Greater Plooriod|ex|M7
D'faria|Hune|mr|Q12
D'ian|Corporate Sector|or|S3
D'janis|Halm|mr|J16
D'Nile|Hertae|mr|Q14
D'Qar|Sanbra|or|O17
D'rinba|Sombure|mr|K17
Da-Vlunn||hs|R11
Daalang|Daalang|mr|Q12
Dachat||co|K9
Daclavian|Perkell|mr|Q7
Dactruria|Clacis|or|J4
Daedalon|Ktilac Regions|ir|N9
Daedus|Samix|or|Q19
Daemen|Woostri|ex|M16
Daermor|Corporate Sector|or|S3
Dagary|Minor|ir|M8
Dagelin Minor|Cadma|or|T8
Daghee|Thusa|mr|O7
Dagobah|Sluis|or|M19
Dagro|Esuain|mr|P7
Dagu|Instrop|or|S16
Dahrtag||co|J13
Dahvil|Rayter|or|J19
Daimar|Daimar|mr|Q16
Daimla|Kallea|or|K21
Dairka|Churba|mr|P15
Daivak|Karthakk|or|Q17
Daiyu|Hocatar|ex|P12
Dakaret|Oktos|mr|Q12
Dakot|Mortex|or|R5
Dakshee|Barma|cl|M9
Dalandae||cl|M9
Dalastine||ir|L14
Dalchon|Dalchon|or|R17
Dalcretti||ir|O8
Dalicron|Dalicron|or|K19
Dalisor|Yushan|mr|K17
Dallenor|Aldino|mr|J17
Dalna|Tunka (Dalnan)|or|I19
Dalonia|Maerdocian|mr|Q13
Dalos|Nilgaard|or|S5
Dalron|Ariarch|mr|J6
Daltarra|Pakuuni|or|T5
Daltarri|Truum|mr|P8
Daluba|Esstran|or|P5
Daluuj|Albanin|or|U13
Damanos|Belderone|or|Q6
Damendine|Calamari|or|U6
Daminia|Perkell|mr|Q7
Damonite Yors-B|Meridian|or|R7
Damoria||cl|N11
Dampher|Tapani|cl|L13
Damualer Triac||ir|O10
Danadine|Dail|or|Q18
Danalbeth|Teraab|mr|P11
Danchian Prime|Dail|or|Q18
Dancreti||ir|N14
Dandalas|Farlax|co|K10
Dandelo|Tammuz|or|T14
Dandoran||hs|R9
Dandrian|Belderone|or|R7
Dankayo||cl|L9
Dannamore|Saijo|or|J20
Danoor|Kathol|or|M21
Danoria|Nouane|ir|N7
Danos|Shadola|or|U8
Danteel|Emmo|co|M12
Dantooine|Raioballo|or|L4
Danuta|Halla|mr|S9
Danzik|Dalonbian|or|M3
Dar'Or|Jospro|or|R7
Darada||co|K9
Darakin||co|M11
Daranc|Meram|or|O4
Dardanellia||ir|N14
Darek|Rachuk|cl|N11
Darellia||co|L10
Darepp||cl|M13
Dargulli||ir|N14
Darie|Likasha|mr|Q14
Dark Nebula|Lothal|or|U7
Darkknell|Grumani|or|M17
Darkon|Chaama|mr|J7
Darlon|Eucer|mr|R7
Darlyn Boda|Javin (Anoat)|or|K18
Darnaburny|Kanz|or|N4
Daro|Ojoster|or|N6
Daronak|Phelleem|or|S7
Daroon|Harron|ex|O11
Darsie||cl|L9
Dartessex||ir|N10
Daruvvia|Hapes Cluster|ir|O9
Darvannis|Calaron|or|T9
Darwikia||co|M10
Daslkehnt|Pelgrin|or|R17
Dasoor|Agarix|mr|K18
Dassal||ur|H7
Datar||ir|L8
Dathomir|Quelii|or|O6
Daupherm Daupherm States||co|K12
Davezra|Dustig|mr|N16
Davirien|Corporate Sector|or|R3
Davnar|Kanchen|co|K9
Dawinia Hynestian||cl|J13
Daxam|Mayagil|or|N18
Daxan Beta|Thesme|or|O6
Dayark|Kathol|or|M21
Dbari|Churnis|mr|I6
De'etta|Sanbra|or|O17
De'nel|Brak|ex|O14
Deadon|Dantus|or|K6
Debray||co|M10
Declavia||co|M11
Deersheba|Iskin|mr|O16
Dega|Elrood|or|M20
Degarian||cl|L13
DeGerrillion|Tamarin|or|N19
Deko|Neimoidia Quellor|cl|N11
Del Zennis|Eucer|mr|R7
Dela|Centrality|or|T8
Delacrix|Calaron|or|T9
Delantine|Varada|or|I19
Delari|Corva|or|P4
Delassin|Calaron|or|T9
Delcontr|Oriolan|mr|J16
Delderaan|Noonian|or|N6
Delemede|Rseik|or|N20
Delephr|Carrion|or|J4
Delfii|Minos Cluster|or|M20
Dellalt|Tion Hegemony|or|T6
Delle||cl|L9
Delmaas|Seswenna|or|M18
Delphania|Esuain|mr|Q7
Delphidian|Cluster|mr|I15
Delphon|Javin (Anoat)|or|K18
Delrakkin|Kallea|or|K21
Delrian||ir|O9
Delriss|Dentari|ex|O8
Deltooine|Corporate Sector|or|S3
Deltron||ir|O10
Deluvia|Klina|or|S13
Demar|Brak|ex|O14
Demesel|Meram|or|P4
Demigue|Demetras|or|P7
Demiloch|Lannik Space|mr|R13
Deminol|Juvex|mr|L17
Demir||ur|G6
Demnadi|Far Xandil|mr|P16
Demonsgate|Kathol|or|M21
Demophon|Demophon|co|M10
Demos|Dustig|mr|N16
Denarii Nebula|Gordian Reach|or|P6
Denash Ash|Worlds (Batonn)|or|T7
Denbar||ir|L14
Denbo|Tamarin|or|N18
Dendada|Seswenna|or|M18
Dene Gois Cluster|Yminis|or|S14
Deneba|Maerdocian|mr|Q13
Denebia|Senex|mr|L18
Denebrilla|Fei Hu|mr|P13
Deneeli||co|M9
Denevar||co|K9
Dennaskar|Manda|mr|R15
Dennogra|Tharin|or|S8
Denon|Iseno|ir|N13
Denova|Ojoster|or|N7
Dentaal||co|K13
Dentamma Nebula|Varada|or|I19
Dentaria|Dentari|ex|O8
Denubba|Likasha|mr|Q14
Denudia|Grohl|or|R15
Denuhi|Greater Plooriod|ex|M7
Denusia||ir|M13
Depatar|Cademimu|or|L6
Deppani|Bri'ahl|or|I17
Deralia|Tammuz|or|T15
Derango|Khuiumin|or|O19
Derella||co|M10
Derellium|Cronese Mandate|or|S6
Derenzil||ws|S18
Deretta|Tarabba|or|N19
Derf|Sluis|or|M19
Derilyn|Elrood|or|M19
Deris-plata|Eucer|mr|R7
Dermos|Belsmuth|or|O6
Derosha||ws|J5
Derra|Mikaster|ex|N15
Derricon|Spirva|mr|L17
Derso|Yminis|or|S14
Dersonn|Tammuz|or|T14
Dervdis||co|L9
Deryvia||ir|L14
Desargorr|Allied Tion|or|S6
Descopose Farmark||mr|H15
Desevro|Tion Hegemony|or|S6
Desinta|Morshdine|or|O5
Desix|Suolriep|or|S9
Desstious|Lambda|mr|P16
Destreg|Bon'nyuw-Luq|or|N18
Devalok|Altier|ex|O13
Devaron|Duluur|cl|M13
Devil's Asteroid||or|O2
Devon|Atrivis|or|L5
Devros|Manda|mr|R15
Devshi||ir|J8
Dexus||cl|L9
Deylerax|Talcene|mr|R8
Deymasoll||cl|J13
Deysum|Trax|mr|Q10
Dhandu||ex|I8
Dhen-Moh||ir|K14
Di'tai'ni|Bothan|mr|R14
Di'wor|Morshdine|or|O4
Diab||ws|J6
Diado|Lifh|mr|R8
Diamal||co|L13
Dianth||ws|T5
Diatia|Major|co|L12
Dibrook|Albarrio|or|K5
Dica Tolemses||ex|P11
Didyma||ws|J5
Dihneral||cl|K13
Dilbana|Baxel|or|U12
Dilestri|Hevvrol|mr|O15
Dilonexa|Centrality|or|U8
Dimea|Dimean|ex|P13
Din Nebula|Zuma (Moddell)|or|H16
Din Pulsar|Zuma (Moddell)|or|H16
Dinlo|Thaere|ex|O14
Dinutu|Colundra|or|S5
Dinwa|Prime|ir|L8
Dinzo|Msst|mr|P7
Dioll|Juvex|mr|L17
Diophos|Quiberon|or|S15
Diorda|Perkell|mr|Q7
Dioya||ur|F8
Direllia|Nembus|or|P4
Dirha||hs|S9
Distilon|Ash Worlds|or|S7
Dithanune|Bortele|mr|R8
Divac|Nuiri|or|Q6
Divora|Hapes Cluster|ir|O9
Dix'thaar||ir|K8
Diyu||hs|S12
Dizon Fray||or|U7
Djurmo|Strabin|mr|M7
Dles|Tharin (Periphery)|or|S8
Dlor|Dononter|mr|I16
DNX-N1||ws|N21
Doan|Halthor|or|M6
Doaskin|Bruanii|mr|K18
Dodz|Zoraster|or|U13
Dohlban|Dohlbani|mr|R13
Dohnia|Semagi|mr|I16
Dohu Dohu||mr|K7
Dol'har Hyde|Sanbra|or|O17
Doldur|Doldur|mr|P15
Doli|D'Astan|or|O6
Dolis|Obtrexta|or|J3
Dolla|Videnda|or|L18
Dolomar|Dolomar|co|K9
Dolsan||co|K9
Dolstan|Kathol|or|M21
Dolva Prime|Semagi|mr|I16
Dom-Bradden|Lol|or|Q18
Domancion|Suolriep|or|S8
Domgrin|Prefsbelt|or|K6
Dominus|Lothal (Dominus)|or|U7
Don I|Tapani|cl|L13
Don II|Tapani|cl|L13
Dona Laza|Dona Laza|ex|P9
Donadus Bamula||ir|J13
Doneer'so|Fakir|cl|K9
Doniphon|Kwymar|or|P4
Dononter Minor|Dononter|mr|I16
Donovia|Hali|ex|O9
Dontamo|Dantus|or|J6
Dooma|Dentari|ex|O7
Doornik-1142|Farlax|co|K10
Doornik-207|Farlax|co|K10
Dor Nameth|Bright Jewel|mr|L7
Dorajan|Lannik Space|mr|Q12
Dorande|Quiberon|or|T15
Dorax||co|L9
Dorcin|Minos Cluster|or|M20
Dordolum||cl|K13
Doreen|Senex|mr|L18
Dorella|Tapani|cl|L13
Dorellia|Tapani|cl|L13
Dorenia|Mayagil|or|M18
Dorin|Deadalis|ex|J8
Doris|Tapani|cl|L13
Dorlo|Atravis|or|L19
Dorlon||cl|M9
Dornea|Lothal|or|U7
Dorriella|Wazta|or|I17
Dorsis|Corellian|co|M11
Dorvalla|Videnda|or|M18
Doshan|Drannik|ex|K8
Dosuun||ws|H20
Dotharian||hs|S12
Dothnia|Hunnoverrs|or|S17
Douglas|Centrality|or|U8
Dowut||co|J12
Doxxen|Seitia|or|K19
Dozoisia|Sevetta|or|S15
Dra|Wyl|or|R4
Draay|Pelgrin|or|R18
Draboon|Mandalore|or|O7
Drackmar|Quelii|or|O6
Dractu|Lannik Space|mr|Q13
Drada|Halthor|or|L6
Draflago|Sertar|or|R5
Dragon Void|Gomar|ir|K14
Dragonflower Nebula|Doldur|mr|P15
Dragos|Boeus|ex|M15
Drahgor|Colundra|or|S4
Draik|Alui|mr|O17
Dramassia|Juvex|mr|L18
Drannik|Drannik|ex|K8
Draria|Lostar|ex|M7
Drash-So|Yminis|or|S14
Drashima|Majoor|ex|N15
Draukyze|Thanium|or|R6
Dravian Starport|Tamarin|or|N18
Dravin|Subterrel|or|L20
Dravione|Allied Tion|or|S6
Drayberia|Sertar|or|R5
Drazkel|Oriolan|mr|J16
Drearia||ir|L8
Dreena|Hapes Cluster|ir|O9
Dreffon||cl|J9
Dreighton|Dantus|or|J6
Dreighton Nebula|Dantus|or|J6
Dreivus Oeiros||ex|P10
Dreizan||co|M12
Dremulae||dc|M10
Dresscol|Trax|mr|Q10
Dressel|Noolian|mr|Q13
Dressia||cl|L8
Dreve||ir|N7
Drexel|Lol|or|Q18
Drexel Minor|Khuiumin|or|O19
Drez|Corva|or|P4
Drezzi|Esstran (Sith Worlds)|or|Q5
Drgi|Tokamac|ex|O13
Drift, The|Elrood|or|M20
Drilbia|Brema|or|M17
Droecil|Boeus|ex|M15
Drog|Corporate Sector|or|R4
Drogheda|Teraab|mr|Q11
Dromondar Beta||ur|H7
Drompani|Prefsbelt|or|J6
Dromund Kaas|Esstran (Sith Worlds)|or|R5
Drong|Steniplis|or|L18
Drongar||or|T5
Dronseen|Thrasybule|or|P6
Drophun||cl|L13
Droxine|Esstran|or|Q5
Droxu|Bheriz|or|T11
Drualkiin|Kessel|or|T10
Druckenwell|Doldur|mr|P15
Drunost|Shelsha|cl|M9
Drup's Star|Saijo|or|J20
Drurish|Kuat|co|M10
Druulgotha|Thesme|or|O6
Dryorkeen Cluster|Parmic|or|P18
Du|Hutta|hs|S11
Du Mai|Bryx|mr|R8
Dubloviann||ir|M8
Dubraib|Cegul|or|M20
Dubrava|Albanin|or|T13
Dubrillion|Myto|or|K3
Dubrovia|Aldino|mr|J17
Duhma|Kallea|or|K20
Duinarbulon|Cronese Mandate|or|S6
Dulathia|Lantillian|mr|P8
Dulin||ir|K14
Dulvoyinn||dc|K12
Dunari's Rest|Mayagil|or|N18
Duneeden|Corusca|co|K9
Dunnak||ir|N8
Dur Sabon|Morshdine|or|O5
Dura-Kahn|Bes Ber Bikade|ex|L15
Durace||ur|H6
Duran||co|K9
Durga|Marzoon|mr|I16
Durgen's Star|Gordian Reach|or|P6
Durgeon|Galov|or|T13
Durkteel|Kastolar|mr|Q10
Duro Duro||co|M11
Durollia|Kalamith|or|P5
Duron|Semagi|mr|I16
Duroon|Corporate Sector|or|S4
Durren|Meridian|or|R7
Dustig|Dustig|mr|N16
Dutar||co|L10
Duunir|Kibilini|or|Q17
Duzay|Alui|mr|O17
Dwartii|Nouane|ir|N8
Dweem|Calaron|or|T9
Dwor|Steniplis|or|L19
Dybbron Nythlide||ir|L15
Dybrin||dc|L12
Dyspeth|Varada|or|I20
Dytrew|Haserian|mr|Q15
Dzass|Seswenna|or|M17
Eadu|Bheriz|or|U10
Ealor|Parmic|or|P18
Eamus||co|L13
Ebaq||dc|M11
Ebenmal|Irnaj|mr|K17
Eberon|Mytaranor|mr|P9
Ebiwaan|Sarin|or|P18
Ebra Kesh||mr|L6
Ec Pand|Ado|mr|M17
Echerta|Koradin|or|J18
Echnos|Hadar|mr|L17
Eckless||ws|J3
Eczar|Seswenna|or|M18
Edan|Hythrope|ex|M15
Edatha|Vatha|ex|K16
Ediorung|Hapes Cluster|ir|O9
Edis|Farana|ws|S3
Edonaaris|Thrasybule|or|P6
Edusa|Morshdine|or|O5
Eedoq|Tantra (Methall'has)|or|M19
Eeyyon|Halm|mr|J16
Egaria|Svivreni|or|O19
Egips|Tharin (Periphery)|or|S8
Ehjenla|Kathol|or|M21
Eiattu|Ado|mr|L17
Eibon|Cronese Mandate|or|S6
Eidoloni|Eidoloni|mr|M16
Eilnia||ir|N9
Eiloroseint|Tokamac|ex|N13
Eiram|Tunka (Dalnan)|or|I19
Eirrauus|Quence|or|P18
Eislo Eislomi||ir|O8
Ejolus||ir|M8
Ekibo|Trianii Space|ws|R3
Ekuda|Cademimu|or|L6
Elamposnia|Gordian Reach|or|Q5
Elatha|Stensen|or|I17
Elbara|Elbaran|mr|J17
Elbra|Airam|or|M20
Elcorth|Farlax|co|K10
Elegasso|Irishi|mr|K6
Elerion|Thanium|or|R6
Elessia|Vendusii|mr|P16
Elgamor|Maldrood|mr|R7
Elgit||hs|T10
Eliad|Minos Cluster|or|M20
Elien||ir|J14
Elin Roe||cl|N12
Elkeenar||ws|K21
Elkkasinn|Phelleem|or|S7
Elliirad|Airam|or|L20
Elom|Sertar|or|R5
Elphrona|Bri'ahl|or|I17
Elriss|Onatos|mr|R15
Elrood|Elrood|or|M20
Elshandruu Pica|Quence|or|O18
Embaril|Allied Tion|or|S6
Emberlene|Authala|ex|P12
Emmer|Nilgaard|or|S5
Emoh|Ploo|ex|N7
Emorus||ir|O10
Empartheca|Hook Nebula|or|O18
Empress Teta|Koros|dc|L10
Emurria||cl|L9
Ena|Steniplis|or|L19
Enaleh||cl|L13
Enarc|Alui|mr|O17
Encrust|Jubilar|or|T7
Endex|Velcar|or|J5
Endor|Zuma (Moddell)|or|H16
Endor Gate|Zuma (Moddell)|or|H16
Endoraan|Clacis|or|K4
Endovan|Sarka|mr|Q8
Endovar|Terrabe|mr|H10
Endoviara|Dantus|or|J6
Endregaad|Indrexu|or|S5
Endrias Minor|Tammuz|or|T14
Endrolia||co|K10
Endymion|Kalamith|or|P5
Enet|Brak|ex|O14
Enferm|Mezeg|mr|M7
Engebo|Danjar|or|N18
Engira|Jospro|or|R7
Enisca||cl|M13
Ennth|Astal|or|Q18
Enoth|Calamari|or|U6
Enrivi|Metatessu|mr|R9
Enselon||co|L12
Ensolica||co|K10
Entana|Cademimu|or|L6
Enthenium|Jjannex|or|K19
Enthi|Manda|mr|R14
Entiia|Maldrood|mr|R7
Entooine|Danjar|or|N18
Entralla|Velcar|or|K4
Entropian Hive|Elbaran|mr|J17
Entrus|Trax|mr|Q10
Entruvia|Halla|mr|R8
Entuur|Urce Space|mr|L6
Eol Sha|Corva|or|P3
Eos|Cadavine|or|P17
Ephemera||ir|J14
Epica|Bes Ber Bikade|ex|L15
Epidimi|Rolion|or|Q7
Epikonia|Ojoster|or|N7
Epo|Ciutric|or|N5
Epsi Nadir|Epsi Collective|ex|M15
Epsi Zenith|Epsi Collective|ex|M15
Epsom|Quiberon|or|S15
Equanus|Veragi|or|K3
Er'Kit|Noonian|or|M6
Er'stacia||ws|V9
Erai|Hangshan|ex|P11
Erdo|Kriz|or|K19
Erebus||cl|N13
Eredenn|Tion Hegemony|or|S6
Eredin|Astal|or|P18
Ereesus|Kanz|or|N4
Eremond||dc|L10
Eres|Esuain|mr|Q7
Erhynradd||ir|N13
Eriadu|Seswenna|or|M18
Erian|Churba|mr|P15
Eridicon|Calamari|or|T6
Erigorm||co|L9
Erilnar|Centrality|or|T8
Eriscot|Haserian|mr|Q14
Ermi|Sertar|or|R5
Eroudac|Doldur|mr|P15
Errimin|Koradin|or|J18
Ertegas|Javin (Anoat)|or|K18
Ertrax||ws|N21
Erub||ir|N14
Erysthes|Corporate Sector|or|S4
Esaga|Esaga|mr|R11
Escabar||ex|I8
Escalan|Cademimu|or|L6
Escander|Taldot|mr|Q9
Escarte|Keldrath|or|T6
Eschaton|Far Xandil|mr|O16
Esfandia||ws|I6
Eshan||ir|N8
Esooma|Sprizen|or|N5
Espinar||co|K9
Espirion||ir|N12
Essebra|Airam|or|M20
Esseles|Darpa|co|L9
Esseveya|Maldrood|mr|R7
Essien|Halthor|or|M6
Ession|Corporate Sector|or|S4
Essowyn|Trax|mr|Q10
Estaph|Tapani|cl|L13
Estaria|Indrexu|or|S5
Esyram|Atravis|or|L20
Etai|Druess|mr|O15
Ethav Major Ethav Regions*||ws|P3
Ethrani|D'Astan (Valahari)|or|N5
Etorasp|Hakartha|ex|K16
Etti|Corporate Sector|or|S4
Euceron|Eucer|mr|Q7
Eufornis|Major|co|M11
Eufornis Minor|Shadola|or|U8
Eva-T|Quence|or|O18
Evas|Belshar|mr|I7
Excarga|Herios|or|T16
Exegol||ur|F7
Exigar|Weneen|or|N6
Exocron|Kathol|or|M21
Exodeen||cl|M12
Exodo|Meridian|or|R7
Extorin Major|Extorin|ex|J15
Extorin Minor|Extorin|ex|J15
Extrictarium Nebula|Ash Worlds|or|T7
Exu Prime|Tolonda|or|R18
Eyar||ir|O10
Eyo-Dajuritz||ir|N10
Ezaraa|Spinward|or|M2
Ezran|Onatos|mr|Q15
F'Dann|Dufilvian|mr|R15
F'tral|Calaron|or|T9
F'tzner Bartahn||ir|L15
Faarlsun||ws|T4
Fabrin|Circarpous|ex|O12
Fadden||ir|N11
Fair Hollis|Karthakk|or|Q17
Fait d'Fait|Venaarian|mr|O7
Faket||ws|G15
Fakir|Fakir|cl|K9
Falang Minor|Thanium|or|R6
Falasia||ir|N10
Falaston|Kallea|or|K21
Faldos|Saijo|or|K20
Falko|Centrality|or|U8
Falleen|Doldur|mr|P15
Fallex|Belderone|or|R6
Fallowan|Sujimis|or|P19
Fangol|Mortex|or|S5
Fanha|Seitia|or|K19
Faos Station|Belsmuth|or|P6
Far Dostany|M'shinni|mr|M7
Far Indosa|Gordian Reach|or|P6
Far Pando||hs|S13
Fara's Belt|Rolion|or|Q6
Farana|Farana|ws|S3
Farbinda||ir|N14
Farbog|Vorzyd|or|R6
Farboon|Tantra|or|M19
Farfalla Indra-su-Mar||ex|P12
Farfax|Marzoon|mr|I16
Farfeld|Jjannex|or|L18
Farhava Beta|Tantra|or|M19
Farj|Varada|or|H19
Farnica|Hapes Cluster|ir|O9
Faro||cl|N10
Farquar|Kurost|mr|Q11
Farrfin|Farrfin|co|K9
Farseen|Msst|mr|P7
Farsellah|Farstey|ex|O8
Farstey|Farstey|ex|O8
Farstine|Ryndellian|mr|P17
Farstone|Juvex|mr|K18
Farwell Station|Eucer|mr|R7
Fasha||cl|M9
Fashinder Prime|Primtara|mr|P15
Faz|Farlax|co|K10
Feather Nebula|Irnaj|mr|K17
Febrini|Hapes Cluster|ir|O9
Fedalle||co|M10
Feddasyr Elus||ir|N12
Federian|Stensen|or|I17
Fedje|Atrivis|or|L5
Fedovoi End|Croynar|ir|M14
Feena|Gordian Reach|or|Q5
Feenicks|Jjannex|or|K19
Feenix|D'Aelgoth|mr|K17
Fef|Glythe|mr|J7
Fegorosk|Obtrexta|or|K4
Fehern|Trax|mr|Q10
Fekunda|Shadola|or|U8
Felacat|Grohl|or|R15
Feldrona|Glythe|mr|J7
Feldwes|Gordian Reach|or|Q6
Feleantor|Halthor|or|L6
Felin|Spinward|or|M2
Fellio|Cadavine|or|P17
Felne|Bon'nyuw-Luq|or|N17
Felucia|Thanium|or|R6
Fendry|Druess|mr|O15
Fenel|Demetras|or|O7
Fengrine|Senex|mr|L18
Fenion|Rolion|or|P7
Fenn|Dufilvian|mr|R15
Fennesa||ir|K14
Fentersohn||ex|I9
Fenves|Boeus|ex|L15
Feraleech|Noolian|mr|Q13
Fere|Quelii|or|O6
Ferijia||co|M10
Feris|Agarix|mr|K17
Fermic|Wazta|or|J18
Ferona Vivaros||cl|N10
Ferrelia|Hunnoverrs|or|R16
Ferrhast||co|L13
Ferrix|Xappyh (Morlana)|or|Q3
Ferro|Illisurevimurasi|or|Q4
Ferrok Pax|Ombakond|ex|P12
Ferros|Ojoster|or|N7
Ferrous Aurora Nebula|Thesme|or|O6
Ferton|Al'Nasrl|or|T13
Fest|Atrivis|or|L5
Feswe Minor|Gordian Reach|or|P5
Feswe Prime|Gordian Reach|or|P5
Fether|Corporate Sector|or|S3
Fetilia|Maerdocian|mr|Q12
Fex||dc|L12
Fhost||ws|H7
Fial|Auril|or|S6
Fibuli|Trianii Space|ws|S3
Fikari|Thanium|or|R6
Fikzwaa||ir|N14
Filata||mr|H10
Filby||co|L9
Fillithar||cl|M9
Filordis Larrin||ir|N8
Filve|Dufilvian|mr|R15
Fimster||ir|L14
Findris|Haldeen|cl|M9
Firrerre|Zuma (Sugai)|or|H16
Firrhana|Ojoster|or|N7
Firro|Farrfin|co|K9
Fislan|Mortex|or|R4
Fitca Prime|Urce Space|mr|L6
Fiumar Quanta||co|M12
Five Points|Thanium|or|S6
Fiviune|Grumani|or|N17
Fjor|Grohl|or|R15
Flacharia||ws|H6
Flandor||ir|N13
Flankers|Fakir|cl|K9
Flashpoint|Meerian|or|O7
Flax|Sumitra|ex|O7
Fleyars|Baroli|ex|N14
Fligger|Kibilini|or|Q17
Florn|Pakuuni|or|T5
Florrum|Sertar|or|R5
Floubette||cl|L13
Fluwhaka|Mortex|or|R5
Flyntaria|D'Astan|or|O6
Fnessal||ir|K14
Fobaris|Parmel|or|O18
Fodro|Clacis|or|K4
Fodurant|Trans-Gascon|mr|P8
Foerost||co|L10
Fokask|Klina|or|S13
Folende|Tion Hegemony|or|S5
Foless||cl|M13
Fondor|Tapani|cl|L13
Font-Alor|Garis|or|N18
Foran Tutha|Cronese Mandate|or|S6
Forbelea||ur|H8
Fordon|Savareen|or|Q16
Forlonis Minor|Tharin|or|S8
Formos|Kessel|or|T10
Fornax|Glythe|mr|J7
Fornow|Pacanth Reach|or|H16
Forntay||co|L12
Forome|Kessel|or|T10
Forrn|Xan|mr|Q15
Forscan|Auril|or|R7
Forsen|Cassander|or|K5
Forvand|Corellian|co|M11
Fostar Haven|Serathrace|ex|P11
Fostin|Grumani|or|N17
Foundry||cl|N10
Foxar||ws|N3
Fracni||ir|J8
Fradian|Roche|mr|Q8
Freda|Esaga|mr|Q11
Freerock||ws|H13
Frego||co|L13
Freliq|Calaron|or|U9
Fremond||ir|N14
Frenos|Cadavine|or|P17
Fresia|Torranix|co|K10
Frewwil||ex|I14
Freya||ws|S18
Frezno|Cademimu|or|M6
Friijillis|Dail|or|P18
Frisal|Atrisian CW|co|J12
Frithia|Glythe|mr|K7
Froffl|Churba|mr|P15
Fromiria|Mortex|or|R5
Fromish||co|M11
Frommon||cl|M9
Frong|Ojoster|or|N7
Froswythe||cl|M13
Froz|Corellian|co|M11
Frunchettan||ws|I6
Fryiaa|Dail|or|Q18
Fuacha|Galov|or|T14
Fusai|Zuma (Fusai)|or|H16
Fwatna|Subterrel|or|K20
Fwiis||ir|M13
Fwillsving|Calaron|or|T10
Fyodos|Tammuz|or|U14
Fyrth||ir|J8
Fytoun|Brak|ex|O14
G'haris|Perinn|or|J4
G'rho||ws|G16
G'Tep'Noi|Croynar|ir|N14
G'wenee|Weneen|or|N6
Gaalt|Meram|or|O4
Gaaten|Garis|or|N17
Gabdor||ex|H14
Gabredor|Myto|or|K4
Gacerian|Baroli|ex|N15
Gad|Brema|or|M17
Gaddria|Oricho|or|M5
Gadon|Cronese Mandate|or|S6
Gaftikar|Kalamith|or|P5
Gagrew|Station|hs|S9
Gailea||co|M12
Gaios||co|K9
Gairm|Venaarian|mr|O7
Gal Milnor|Seitia|or|K19
Gala|Nuiri|or|Q7
Galaan|Corva|or|P4
Galagolos||cl|J9
Galand|Torranix|co|K10
Galantos|Farlax|co|K10
Galara|Roche|mr|Q8
Galator|Belsmuth|or|O6
Galboron|Hertae|mr|Q14
Galdi|Brema (Reithcas)|or|M18
Galdria|Cronese Mandate|or|S6
Galdronia||co|L10
Galidraan|Thanium|or|R6
Galitan|Bormea|co|L9
Galjaero|Tungra|or|K18
Gall|Cadavine|or|P17
Gallapraxis|Hythrope|ex|M16
Galleefryn|Corporate Sector|or|S3
Gallimere|Thuris|or|P19
Gallinore|Hapes Cluster|ir|O9
Gallion|Grumani|or|N17
Gallios|Tragan Cluster|or|N5
Galloa|D'Astan|or|O5
Gallshebbis Prime|Nilgaard|or|S5
Galltine|Thesme|or|O6
Gallus|Allied Tion|or|S6
Galmerah|Jalor|mr|J7
Galov|Galov|or|T14
Galpos|Abrion|or|S15
Galsol|Belderone|or|R6
Galtea|Kathol|or|M21
Galtea Binary|Kathol|or|M21
Galvoni||co|K9
Galzez|Dustig|mr|M17
Gam Tim'nisi|Tungra|or|K18
Gama||co|L12
Gamerong|Nijune|or|N4
Gammalin|Vish|mr|N16
Gamor|Chaykin|ex|O14
Gamorr|Galov|or|T14
Gan Moradir|Xan|mr|Q15
Ganath||hs|R12
Gand|Shadola|or|T8
Gandalla|Boeus|ex|M15
Gandan|Oricho|or|M6
Gandeal||co|M12
Gandeid Trailing|Grant|ex|J15
Gandle Ott|Kathol|or|M21
Gandolo|Lahara|or|M5
Gandrossi|Perinn|or|J4
Gandrun||cl|J13
Gangxi|Station|ws|I15
Gania|Tapani|cl|L13
Ganlihk|Dantus|or|J6
Gannaria|Trilon|or|H15
Gannymeda||ir|M8
Ganoidi|Brema|or|M17
Gansett|Manda|mr|R15
Gansevor|Tammuz|or|T14
Ganthel|Bormea|co|L9
Gantho||ir|N12
Gantonnerre||ir|N8
Ganzik|Maldrood|mr|R7
Garban|Abrion|or|S15
Garcornia|Ado|mr|M17
Gardaji|Rift (Gardaji)|or|M1
Garel|Lothal|or|U7
Garen|Thuldin's Grant|ex|J15
Garfin|Immeria|ex|O14
Gargolyn||ws|I8
Gargon|Mandalore|or|O7
Garia|Brak|ex|O14
Garis|Tamarin|or|N18
Garn|Cadma|or|T8
Garnib|Bozhnee|or|L18
Garobi|Tapani|cl|L13
Garollia|Baroli|ex|N15
Garos|Msst|mr|P7
Garqi|Cassander (Tadrin)|or|K5
Garr'lst||ir|O8
Garrthinius|Steniplis|or|M18
Garwillia||co|M10
Gascon|Trans-Gascon|mr|P8
Gastrula|Rayter|or|J19
Gatalenta||co|M10
Gathus|Tynquay|or|Q4
Gattering|Noolian|mr|Q13
Gaulus|Gaulus|or|S17
Gaurick|Corporate Sector|or|S4
Gavana|Belasco|ex|O11
Gavens|Tregillis|ex|M15
Gavos|Kastolar|mr|Q10
Gavriza|Prackla|ex|O8
Gavryn|Romintine|mr|Q8
Gaxxa||ir|N10
Gazian|Truum|mr|P8
Gazzari|Grumani|or|M17
Gazzari Minor|Garis|or|N17
Gbu|Keldrath|or|T6
Geal|Gendius|mr|K17
Gedi|Arkanis|or|R16
Geedon|Sumitra|ex|N7
Gefthaine|Mandalore|or|O7
Geillia|Keldrath|or|T6
Geister|Iskin|mr|O16
Gelda|Carrion|or|J4
Geldoll|Kossa|ex|O11
Gelemeade|Kordu|mr|L7
Gelgelar|Elrood|or|M20
Gellefon|Savareen|or|Q16
Gelviddis|Cluster|ir|N9
Gem,|The|ur|G14
Genassa|M'shinni|mr|M7
Gendius|Gendius|mr|J17
Gendoraan||co|M10
Gendrah-Narvin||ir|N13
Generis|Atrivis|or|L5
Genesia|Brak|ex|O14
Genetia||ex|I14
Genhu|Tharin (Periphery)|or|S8
Genian|Trax|mr|P10
Geniseria|Jurzan|ex|M15
Genon||ir|N13
Genosha||or|I20
Geonosis|Arkanis|or|R16
Gepparin|Shelsha|cl|M9
Geptish|Yushan|mr|K17
Geran|Calaron|or|T9
Gerhalt|Altier|ex|O13
Geridard|Doldur|mr|P15
Gerinia|Trans-Vulta|mr|N7
Geris|Trans-Vulta|mr|O7
Geroon||ur|I8
Gerrard||co|K12
Gerrenthum|Javin (Anoat)|or|K18
Gerres Gule|Primtara|mr|P15
Gerrigon|Masla|mr|J17
Gertafuu||ws|S18
Gerzob|Hunnoverrs|or|R18
Gesaral Beta|Gordian Reach|or|P6
Gesaril|Minos Cluster|or|M20
Geska Prime|Lifh|mr|Q8
Gestrex|Calaron|or|T9
Gestron|Tennuutta|mr|Q7
Gevarno Cluster|Brema|or|M17
Ggy-ynt|Esuain|mr|Q7
GH-531||ur|I5
Ghaina||co|K9
Ghalla|Airam|or|L20
Gheia|Albarrio|or|K5
Gherillia|Bes Ber Bikade|ex|L15
Ghishi|Daimar|mr|Q16
Ghita|Atravis|or|L19
Ghoba|Chitarghar|ex|K15
Gholondreine|Chitarghar|ex|K15
Ghonoath|Croynar|ir|M14
Ghorman|Sern|cl|L13
Ghorn|Tharin (Karstaxon)|or|S8
Ghost Moon|Wornal|mr|K16
Ghost Nebula|Ghost Nebula|ex|P10
Ghothia|Stensen|or|I16
Gibad|Abrion|or|S15
Gibbela|Atrivis|or|L5
Gibraal|Itopol|ex|K15
Giddea|Merthian|ex|N13
Giermos||cl|L8
Gigor|Tynquay|or|R4
Giju Herglic|Space|cl|L13
Gilatter|Churnis|mr|I7
Gilliana|Tapani|cl|L13
Gilvaanen||ir|L8
Ginn Jump||co|L10
Giryulan||ws|U6
Gizer|Lantillian|mr|P8
Glade|Gordian Reach|or|P5
Glakka|Wyl|or|R4
Glassferra||ir|N9
Glastis|Chiss Space|ur|F8
Glavis||co|M11
Glee Anselm|Jalor|mr|J7
Gligger|Ash Worlds|or|S7
Glite-Ven|Aparo|or|R3
Glithnos||co|M10
Glom Tho|Hevvrol|mr|O15
Gloon|Kessel|or|T10
Glottal|Baxel|or|U11
Glova|Tarabba|or|M19
Gmar Askilon Krenhner||ir|L14
Gnithia|Jospro|or|R7
Goa|Bes Ber Bikade|ex|L15
Gobindi|Noonian|or|M6
Gobreton|Barma|cl|M9
Godo|Quence|or|O18
Godsheart,|The|hs|T11
Goelitz|M'shinni|mr|M7
Goff|Airam|or|L20
Goibniu|Videnda|or|L18
Golatha|Dalicron|or|K19
Golatha Nebula|Dalicron|or|K19
Golden Nyss|Fellwe|ex|L8
Golh|Videnda|or|L18
Goliath Mal||cl|N10
Golkus||cl|K9
Golrath|Sanbra|or|O17
Golus Pheyar|Tion Hegemony|or|T6
Golus Station|Vilonis|mr|O16
Goluud|Minor|co|L10
Goluud|Prime|dc|L10
Gom|Tregillis|ex|L15
Gon Tiek|Atravis|or|L19
Gonda|Bon'nyuw-Luq|or|N18
Gondagali|Lahara|or|M5
Gonmore|Fath|or|K6
Gontzol||cl|L13
Goorla|Corellian|co|M11
Goratak|Vensensor|ex|K16
Gorbah|Atravis|or|L19
Gorgaria|Karthakk|or|Q17
Gorm|Meerian|or|O6
Gorma|Majoor|ex|N15
Gormen|Nuiri|or|Q7
Gorno|Arkanis|or|R17
Gorobei||ir|M8
Goroth|Trans-Nebular|mr|R16
Gorse||ir|O10
Gorsh||ws|O3
Gortus|Kanz|or|N4
Gorvinia|Thusa|mr|O7
Gos|Hutta|hs|S11
Gosfambling|Lifh|mr|R8
Gosho|Parmel|or|O18
Goshyn|Tolonda|or|Q18
Gotar||ws|U9
Gotida||ir|O10
Gotoma|Farlax|co|K10
Gottlegoob||ws|O20
Govia|Corellian|co|M11
Gowdawl||ir|M14
Gozgo||hs|S9
Gra Ploven||cl|N12
Graador|Graador|mr|I17
Graal'diin|Spadja|or|R6
Graddus Rex||ir|L14
Gradilis Rift||ws|I5
Grakouine|Onatos|mr|R15
Gralack|Kwymar|or|P4
Graland|Corellian|co|M11
Grand Tharkand||ir|O9
Grandak|Cronese Mandate|or|S6
Grandeel|Tynna|ex|N14
Grandine||cl|M9
Grange|Kurost|mr|Q11
Granna||co|K10
Granus||ir|M14
Grast||ir|J14
Grathus|Jospro|or|R7
Grava|Kallea|or|K20
Gravan||ir|O8
Gravane|Klina|or|S13
Gravdinia||cl|N10
Gravlex Med|Raioballo|or|L4
Great Aglamerti|Charra|ex|P14
Great Forveen Nebula|Churnis|mr|J6
Great Zilk|Irishi|mr|K6
Greater Marianas|Sevetta|or|S15
Gree|Veragi (Gree Enclave)|or|L2
Gree Baaker|Atrivis|or|L5
Greeb-Streebling Cluster|Bozhnee|or|L18
Greeve|Grumani|or|N17
Gregonia|Dimean|ex|P13
Grehollo Manoe||mr|K7
Grella|Tapani|cl|L13
Greyman's Planet|Wazta|or|J18
Grimdock|Axion|ex|P10
Grimwald|Truum|mr|P8
Griq||ur|H7
Grizal|Hadar|mr|L17
Grizmallt||co|L9
Gromas|Perkell|mr|Q7
Groth||hs|S11
Grumwall|Illisurevimurasi|or|Q4
Gruvia|Hilo|ex|P13
Gryphon||ir|N9
Guagenia Guagenian||ir|J14
Guat'a|Torch Nebula|or|P19
Guavian Drift|Meram|or|P4
GUHL-J03870|Trilon|or|H15
Guiteica Kadok Regions*||ws|J4
Gulf of Tatooine|Arkanis|or|R16
Gulhadar||ir|L8
Gulma||ws|P3
Gultanna Va di Gult||mr|K8
Gulvitch|Gordian Reach|or|Q6
Gundravia|Hadar|mr|L17
Gunthar|Kriz|or|J18
Gurrisalia|Relgim|or|L5
Gutretee|Javin (Anoat)|or|K18
Guudria||ws|R19
Guuko|Weneen|or|N6
Gwar||mr|H15
Gwongdeen||cl|J9
Gwori|Clacis|or|K4
Gymelo|Bakura|or|G16
Gyndine|Circarpous|ex|O12
Gyndorath||ur|G11
Gyosha||co|K12
H'Grathi Nebulae|Thrasybule|or|P6
H'ken|Corva|or|P4
H'nemthe|Mayagil|or|M18
H'ratth||ir|N10
H'relac|Aparo|or|R3
Haariden||ir|O9
Haaridin|Kwymar|or|P4
Haashimut|Ash Worlds|or|S7
Habassa|Herdessa|mr|Q16
Had Abbadon||dc|L10
Hadi|Kalamith|or|P5
Hadlress||ir|M14
Hadros|Prefsbelt|or|J6
Hafernia||ir|J8
Haffrin|Esstran|or|Q4
Hagar Secundus|Brak|ex|O14
Haidoral Prime|Kastolar|mr|R10
Haileap|Tunka (Dalnan)|or|I19
Hakara|Corva|or|P3
Hakartha|Hakartha|ex|K16
Hakassi||dc|M11
Hakotei|D'Astan|or|O6
Halais||cl|N10
Halanit||cl|N11
Halbara|Elrood|or|M20
Halcyon||cl|K13
Haldeen|Haldeen|cl|M9
Hali|Hali|ex|O9
Hallion|Esstran (Sith Worlds)|or|R5
Hallitron|Jalor|mr|J7
Halloways||ir|O9
Hallrin|Surron|ex|O13
Halm|Halm|mr|J16
Halmad|Quelii|or|N6
Halowan|Fakir|cl|K9
Halpat||co|K9
Halthor|Halthor|or|L6
Haluria|Vendusii|mr|P16
Halyard|Bes Ber Bikade|ex|L15
Handooine|Phelleem|or|S7
Haneli|Arc d'Stot|ex|K15
Hanna||ir|M8
Hanod|Corva|or|P3
Hanofar||cl|L13
Hapes|Hapes Cluster|ir|O9
Hapor||ir|O8
Hapuntep|Ado|mr|M17
Har Binande|Har Worlds|ex|J16
Harbin-re||ir|N13
Harda|Phelleem|or|S7
Hardex|Jubilar|or|T7
Hargeeva|Jurzan|ex|M15
Harix||cl|K9
Harko Station|D'Astan|or|N5
Harkrova||ir|N9
Harlequin|Station Garis|or|N17
Harloen|Belsmuth|or|O6
Harloff|Minor|co|L9
Harpori|Druess|mr|O15
Harrandarr|Bosph|or|Q3
Harridan|Dantus|or|J6
Harrin Harrin||ir|L15
Harrod's Planet|Oplovis|or|M5
Harswee|Mandalore|or|O7
Hartaga|Drannik|ex|K8
Harterra|Hapes Cluster|ir|O9
Haruun Kal|Dustig|mr|M17
Hasaq|Askarian|ex|P12
Haseria|Haserian|mr|P15
Hasiki||ir|O8
Hassaria|Wazta|or|I17
Hasskyn|Minos Cluster|or|M20
Hast||ws|U6
Hathrox|Halla|mr|R10
Haurgab|Spirva|mr|L16
Havel|Prime|ir|L8
Haven|Minos Cluster|or|M20
Haverling|Albarrio|or|K5
Havricus||cl|N12
Hazun|Astal|or|P17
Hazzard|Lahara|or|M5
Heap Nine|Boeus|ex|M15
Hebekrr|Ojoster|or|N7
Heffrin|Arkanis|or|R17
Hefi|Abrion|or|S15
Hei|Thrasybule|or|P6
Heliconia||co|L10
Helikoprion|Nilgaard|or|S5
Helix|Meridian|or|R6
Helleguth||ir|N13
Hellenah|Xan|mr|Q15
Hellhoop, The|Hocatar|ex|P12
Hellios|Tapani|cl|L13
Helmaxa||ir|M14
Helska|Dalonbian|or|L2
Hemei||co|M12
Hendanyn||cl|M13
Hendrix|Iska|mr|J16
Hensara|Rachuk|cl|N11
Heptalia||ir|M14
Heptooine|Grumani|or|N17
Herakal|Ghost Nebula|ex|P10
Herdessa|Herdessa|mr|Q16
Herego||cl|M9
Herios|Herios|or|T16
Heriston|Atravis|or|L19
Hermos|Spadja|or|R5
Hero Twins|Relgim|or|L4
Herrik|Dantus|or|J6
Herstell||cl|N12
Herzob||cl|N12
Hesperys Station|Tunka (Dalnan)|or|I19
Hestria|Senex|mr|L18
Heterkus|Tharin|or|S8
Hethar|Atrivis|or|L5
Hetnagaro|Andirma|ex|L15
Hettitite|Dalonbian|or|M2
Hettsk|Belsmuth|or|P6
Hetzal|Savareen|or|Q16
Heva|Sevetta|or|S16
Hevurion||ir|L8
Hewett|Hewett|mr|M6
Hewl|Eidoloni|mr|M16
Hexus|D'Astan|or|O5
Hibrath||ur|G7
Hidden Tegoor|Albanin|or|T12
Hiffis|Jjannex|or|L18
High Chunah|Javin|or|K18
Hiit|Corporate Sector|or|S3
Hijado|Thesme|or|O6
Hijarna|Orus|ir|M8
Hijo Hijoian|Space|ex|J8
Hikil|Grohl|or|R16
Hillindor Echo||ir|M13
Hilo|Hilo|ex|O13
Hinakuu|Calamari|or|U6
Hinari|Thesme|or|O6
Hinda|Airam|or|L20
Hindasar|Corpheli|ex|M8
Hindle||co|M12
Hino||cl|N10
Hintis|Parmel|or|O18
Hintivan|Corva|or|Q3
Hiorin|Ash Worlds|or|T6
Hirsi|Elbaran|mr|J17
Hishyim|Abrion|or|S15
Hismaul|Karthakk|or|Q16
Hisseen|Yucrales|mr|R15
Hissrich|Spadja|or|R6
Hitaka|Cademimu|or|M6
Hivebase-1|Minos Cluster|or|M20
Hjaff||cl|J13
Hleua|Eucer|mr|Q7
Hodi||co|M10
Hofsgut|Hewett|mr|M7
Hok||cl|M9
Holador|Herios|or|T16
Holageus|Charra|ex|P14
Holess|Manda|mr|R14
Hollastin||hs|S12
Hologram Fun World|Phelleem|or|S7
Holpern|Arkanis|or|R16
Homana|Strabin|mr|M6
Homon|Homon|mr|M7
Honoghr|Kessel|or|T10
Hoogon|Dantus|or|J6
Hope Station|Haserian|mr|Q14
Horain||ir|L14
Horizon Base|Veragi|or|K3
Horn Station|Lahara|or|M5
Horob|Vardoss|ex|I8
Horos|Lambda|mr|Q15
Horox|Lahara|or|M5
Horska||cl|J9
Horthav|Kuat|co|M10
Hortolo|Trans-Vulta|mr|O7
Horuz|Atrivis|or|L5
Hosko||hs|S11
Hosnian Prime Hosnian||co|M12
Hosrel|Centrality|or|U8
Hoszh Iszhir|Uoti|co|K9
Hoth|Javin (Anoat)|or|K18
Houche|Zuma (Sugai)|or|H16
Hovan|Senex|mr|L18
Hoven||ir|O8
Hovun|Sepan|ex|P13
Hoxim||ur|G9
Hoylin|Fei Hu|mr|P13
Hradreek|Graador|mr|I17
Hraki|Vorzyd|or|R6
Hrasskis|Kossa|ex|O11
Hreeshi|Kalamith|or|P5
Hrel|Relgim|or|L5
Hrill|Yminis|or|S15
Hrthging|Mandalore|or|O7
Hudalla|Stensen|or|I17
Huk||ws|J4
Huldamun|Arkanis|or|R17
Hull's Star|Farana|ws|S3
Huloon||hs|S11
Humbarine Humbarine||co|M10
Hurd's Moon|Bortele|mr|R8
Hurikane||ws|V9
Huro|Ciutric|or|N5
Hurrim|Danjar|or|N18
Huru|Mieru'kar|or|N4
Hutlar|Senex|mr|L17
Huulia||cl|N12
Huvveck|Juris|or|O17
Huwaw|Lahara|or|M5
Hyabb Krenher||co|K9
Hyborea|Semagi|mr|I16
Hyder|Tarabba|or|M19
Hydra|Aparo (Catarlo)|or|R3
Hydraxia||ir|M13
Hyell|Vilonis|mr|O16
Hylaia||ir|O9
Hylanth|Meram|or|O4
Hylobi|Taldot|mr|Q8
Hynah|Kalamith|or|P5
Hynestia Hynestian||cl|J13
Hyperkarn|Grohl|or|R16
Hypori|Ferra|or|S16
Hypotria|Bortele|mr|S8
Hyrol Preen Beta|Portmoak|or|P18
Hysalria|Sluis|or|M19
Hythrope|Hythrope|ex|M15
I'vorcia Prime|Mieru'kar|or|O4
Iakar|Rseik|or|N20
Ianane||ws|I10
Iast|Aldino|mr|J17
Ibaar|Jubilar|or|T8
Ibanjji|Mieru'kar|or|N4
Ibbe|Subterrel|or|L20
Iceni|Corporate Sector|or|R4
Ichalin Station Hijoian|Space|ex|J8
Ichtor|Sombure|mr|K16
Icindra|Calamari|or|U6
Idaflor|Sarin|or|O18
Idolia|Halthor|or|M6
Iego|Ash Worlds|or|T7
Ifmix||cl|M9
Ifron|Thuris|or|P18
Ihopek|Mayagil|or|N18
Ikari||ws|H14
Ikkrukk|Ryndellian|mr|P17
Ikon|Majoor|ex|N15
Iktotch|Narvath|ex|O14
Ilamna|Eucer|mr|Q7
Iliabath|Mortex|or|R4
Ilimardon|Nicandra|mr|L7
Illarreen|Herios|or|T16
Illmuth|Corellian|co|M11
Illodia|Illodia|co|K13
Illoud|Hali|ex|O9
Iloh||ir|N9
Ilos||hs|R10
Ilos|Minor|hs|R10
Ilthan||co|M11
Ilum||ur|G7
Imberlin|Imberlin|ex|P14
Imdaar|Dantus|or|J6
Imena|Varada|or|H19
Imerria|Immeria|ex|O14
Immalia|Immalia|ex|K8
Immeldia|Ash Worlds|or|T7
Imram|Lannik Space|mr|R13
Imroosia||ir|N9
Imvur|Hertae|mr|Q14
Imynusoph|Kallea|or|J21
Inamorata, The|Bheriz|or|U10
Inat Prime|Quiberon|or|S15
Indellian|Javin (Yarith)|or|K18
Indoumodo||ws|S18
Indu San|Rolion|or|Q7
Indupar|Ado|mr|M17
Ingae|Rseik|or|N20
Ingo|Bortele|mr|R8
Injopan|Kessel|or|T10
Innton|Sluis|or|M18
Insk||ws|P3
Insta|Majoor|ex|N15
Intran|Brak|ex|O14
Intuci|Abrion|or|S15
Inusagi|Vilonis|mr|O16
Inysh||co|J12
Iokath||ur|D7
Iol||ur|I10
Ione|Javin (Anoat)|or|K18
Iope||dc|L10
Iotra|Suolriep (Iotran Expanse)|or|S8
Ipellrilla|Glythe|mr|K7
Iphar||ir|L14
Iphigin||co|L13
Ipsidon|Corthenia|mr|K7
Irff|Couronne|ex|P10
Iridia|Glythe|mr|J7
Iridium|Atrivis|or|L5
Iridonia|Glythe|mr|J7
Irith||hs|S11
Irkalla||ur|G13
Irmenu|Belsmuth|or|O6
Irudiru|Wyl|or|S4
Iscera|Dalchon|or|R17
Iscno||co|K12
Isde Naha|Javin (Yarith)|or|K18
Isen|D'Astan|or|N5
Iseno|Iseno|ir|N13
Ishanna|Circarpous|ex|O12
Ishbix|Agarix|mr|K17
Ishram Nebula|Seitia|or|J20
Isht||co|L13
Isiring|Cassander (Tendrannan)|or|L5
Iska|Iska|mr|K17
Iskallon||ws|H14
Iskalon|Trans-Nebular|mr|R16
Iskin|Iskin|mr|O16
Isobi||ir|M8
Isolt|Sujimis|or|P19
Ison|Javin (Anoat)|or|K18
Issagra|Corporate Sector|or|S4
Issor|Arkanis|or|R17
Istic|Teraab|mr|Q11
Italbos|Halori|mr|Q7
Itani||ir|N14
Itani|Nebula|ir|N14
Itapi|Prime|co|L9
Ithica||ir|K14
Ithor|Ottega|mr|M6
Ithori|Ado|mr|M17
Ithull|Airon|ir|O10
Iti|Tammuz|or|T14
Ivarujar|Vensensor|ex|K16
Ivatch|Kathol|or|M21
Ivera||co|L12
Ivexia|Tennuutta|mr|Q7
Ividal|Ividal|mr|P14
Ivis||ir|N10
Ixilix Japrael||ir|O9
Ixtlar Ixtlar||co|L10
Ixzinia|Agarix|mr|K17
Iyred|Kibilini|or|Q17
Iyuta|Fakir|cl|K9
J'doytzin|Maldrood|mr|R7
J't'p'tan|Farlax|co|K10
Ja-bess|Tragan Cluster|or|N5
Jaatovi||ir|N14
Jabiim|Phelleem|or|S7
Jabone|Tennuutta|mr|Q7
Jabor|Ado|mr|M17
Jaciprus||co|M11
Jaelen|Irishi|mr|K6
Jaemus|Obtrexta|or|K4
Jafan|Chommell|mr|O16
Jaga's Cluster|Esstran|or|Q5
Jagomir|Esstran|or|Q5
Jaguada|Esstran (Sith Worlds)|or|R5
Jahilid||ws|L21
Jakelia|Mandalore|or|O7
Jakku||ir|I13
Jalarren|Senex|mr|L18
Jalin||co|M11
Jalindi|Gordian Reach|or|P6
Jaloria|Jalor|mr|J7
Jalucaz|Subterrel|or|L20
Jaminere|Allied Tion|or|S6
Jamiri|Myto|or|K4
Jamiron|Chiss Space|ur|F8
Janako||ir|N11
Janara||ir|L14
Janaus|Thrasybule|or|P6
Jandolhoon|Bosph|or|Q3
Jandoon|Corva|or|P4
Jandur||ir|J14
JanFathal|Fath|or|K6
Jangelle|Kathol|or|M21
Janguine|Halthor|or|L6
Janilis|Cronese Mandate|or|S6
Jankok|Bozhnee|or|L18
Janodral Mizar|Indrexu|or|S5
Jante|Esaga|mr|Q11
Japai|Yushan|mr|K17
Japeal|Kanz|or|N4
Jappe|Tapani|cl|L13
Jarbanov|Serathrace|ex|P11
Jardeen Trans-Jardeen||ex|K16
Jaresh|Corva|or|P4
Jargridia|Sprizen|or|N5
Jarnollen|Bright Jewel|mr|L7
Jarsatt|Hakartha|ex|L16
Jarvanam|Astal|or|P17
Jastro||co|M10
Jatir||cl|L9
Javarica|Tynquay|or|Q4
Javin|Javin|or|K18
Javis|Tapani|cl|L13
Jaxus||co|M10
Jaymir||mr|I16
Jazbina|Lostar|ex|M8
Jebble|Ojoster|or|N7
Jedd||ws|I14
Jedha|Terrabe|mr|H10
Jekara|Bryx|mr|R7
Jelucan|Kwymar|or|Q4
Jendar|Nembus|or|P4
Jendiria|Maldrood|mr|R7
Jendorn|Farstey|ex|O8
Jenenma||ir|M13
Jenoport||cl|M9
Jentares|Mieru'kar|or|N3
Jeosyn|Weneen|or|N6
Jereth|Bozhnee|or|L18
Jerijador|Calaron|or|T9
Jermac|Portmoak|or|P18
Jerne|Kanz|or|N4
Jero|Teraab|mr|Q11
Jerrilek||dc|L10
Jerrist|Corporate Sector|or|S4
Jestan|Corpheli|ex|M7
Jevelet||co|K10
Jexeria|Tharin|or|T8
Jeyell|Roche|mr|Q8
Jhantoria|Allied Tion|or|S6
Jhensrus|Trax|mr|Q10
Jhosh|Albarrio|or|K5
Jiaan Almak||mr|J17
Jidlor|Jidlor Marches|mr|J16
Jillsaaria|Minos Cluster|or|M20
Jilrua||hs|R12
Jinda|Tapani|cl|L13
Jindau|Station|ir|L15
Jinet|Brak|ex|O14
Jiran|Dantus|or|J6
Jiroch|Yushan|mr|K17
Jiruus|Rolion|or|P7
Jjannex|Jjannex|or|L19
Jmin|Masla|mr|J16
Jocal|Ghost Nebula|ex|P10
Jodaka|Hapes Cluster|ir|O9
Jofoger|Tharin (Periphery)|or|S8
Joh'Cire|Alui|mr|N17
Johria||co|M11
Joiol|Orus|ir|M8
Jolia|Eucer|mr|Q7
Jolynria|Atravis|or|L20
Jomark|Jospro|or|R7
Jondora|Ojoster (Taris)|or|N7
Jonsior||co|L10
Joodrudda||ws|S4
Joralla|Mektrun|mr|L17
Joran Station|Rolion|or|P7
Jorgan|D'Astan|or|O5
Joruna|Farlax|co|K10
Jostaar|Kibilini|or|Q17
Jovan|Gordian Reach|or|P6
Jovaria|Hapes Cluster|ir|O9
Jubalene|Grumani|or|N17
Jubilar|Jubilar|or|T7
Judakann|Torch Nebula|or|P18
Juinkwy||ir|J8
Julio Marcol||ir|L8
Julsujod|Tolonda|or|Q17
Juma|Dalchon|or|R17
Jumeria||co|M10
Jumus|Corellian|co|M11
Junction|Vorc|mr|J7
Junction|Thesme|or|O5
Junkfort Station|Tharin|or|T8
Junobia|Keldrath|or|T6
Juntar|Emmo|co|M12
Jurio|Corva|or|P4
Jurzan|Jurzan|ex|M15
Jurzuu|Suolriep|or|S8
Jussafet|Weneen|or|N6
Jutrand|Grumani|or|M17
Juvex|Juvex|mr|L18
Juzzia||ir|N8
Jweab|Locris|ex|O8
K'ath|Juvex|mr|L18
k'Farri|Hapes Cluster|ir|O9
K'taktaxka||ir|J14
Ka'Dedus|Tharin (Periphery)|or|S8
Kaa||cl|N10
Kaal|Yushan|mr|K17
Kabaira|Bajic|or|P17
Kabal|Mayagil|or|N18
Kabieroun|Nijune|or|O4
Kaboryth Cluster|Thaere|ex|O14
Kabray|Corweillian|mr|P15
Kadavo||ws|S4
Kaddak|Tammuz|or|T14
Kaderin|Wazta|or|J18
Kadril|Thanium|or|R6
Kaelen||ir|M9
Kaellin|Corbett|mr|I17
Kafane||hs|S9
Kaifo||cl|N11
Kaikielius||co|L10
Kail|Corporate Sector|or|R3
Kailion|Kailion|ex|O13
Kailor||co|L10
Kaisa|Corva|or|P3
Kajim|Locris|ex|O8
Kakra||ws|I14
Kal'Shebbol|Kathol|or|M21
Kalaan|Churnis|mr|J7
Kalab|Sluis|or|M19
Kalandis Pallis||ir|N14
Kalarassi||ir|K8
Kalarba|Hevvrol|mr|P15
Kalastar||or|I20
Kaldar Trinary|Chopani|or|M4
Kalee||ws|J4
Kalgo|Senex|mr|L18
Kalidorn||ws|O20
Kaliida Nebula|Juris|or|O17
Kalinda|Vilonis|mr|O16
Kalishik|Gordian Reach|or|Q6
Kaliska|Sombure|mr|K17
Kalist||dc|K12
Kalki Nebula|Cassander (Tendrannan)|or|L5
Kalkovak|Bortele|mr|S8
Kalla|Corporate Sector|or|S4
Kallakea|Authala|ex|P12
Kaller|Cassander|or|K5
Kallidah|Subterrel|or|L20
Kallistas|Parmel|or|O18
Kaloom|Noonian|or|M6
Kalsunor|Esstran (Sith Worlds)|or|R4
Kalzeron|Bri'ahl|or|I17
Kamar||ws|S3
Kamasto|Grumani|or|M17
Kamdon|Calamari|or|U7
Kamgeddon|Harron|ex|O12
Kamil||ws|J6
Kammia||ws|G16
Kamori||co|M11
Kamparas|Dolomar|co|K9
Kampe||dc|L11
Kamper|Tapani|cl|L13
Kamur|Senex|mr|L18
Kanaver|Tion Hegemony|or|S5
Kankalo|Esuain|mr|P7
Kant|Bothan|mr|R14
Kanzi||cl|N12
Kaon|Tion Hegemony|or|S6
Kar'a'katok||co|K9
Kara-bin|Tharin|or|T8
Karalle|Albanin|or|T13
Karambola|Al'Nasrl|or|T13
Karatha|Tregillis|ex|L15
Karavis|Obtrexta|or|K4
Karaxis||ws|I7
Karazak|Sujimis|or|P19
Kardava|Sevastol|mr|P14
Kardoa|Atrivis|or|L5
Kardura|Juvex|mr|L17
Kareas|Prefsbelt|or|K6
Karee|Nuon e Safyd|ex|P12
Karfeddion|Senex|mr|L18
Karga|Dustig|mr|N16
Karideph|Minos Cluster|or|M20
Kariek||ws|I6
Karinda|Wazta|or|J18
Karka|Clacis|or|K4
Karkaris|Nilgaard|or|S5
Karken||ir|L8
Karlinus|Chommell|mr|O16
Karltonia||co|K13
Karnac|Cadma|or|T8
Karnak Alpha||co|M10
Karnst|Tharin (Karstaxon)|or|S8
Karoon|Shadola|or|U8
Karra|Rayter|or|J19
Karsten's World|Gordian Reach|or|Q6
Karthon|Zuma (Sugai)|or|H16
Karthrexia|Kriz|or|K19
Kartoosh|Narrant|mr|I16
Karvathia|Tokamac|ex|N13
Karvoss Parmorak||co|M12
Kashir|Vardoss|ex|J8
Kashoon|Colundra|or|S5
Kashyyyk|Mytaranor|mr|P9
Kasiol|Pelgrin|or|R18
Kaski|Calaron|or|U8
Kaspas|Hevvrol|mr|O15
Kassido|Juvex|mr|L17
Katalia|Thesme|or|O5
Katalla|Kastolar|mr|R10
Katanos|Xan|mr|Q15
Katarr|Vensori|mr|O8
Katchan|Kallea|or|K20
Kath|Dustig|mr|M17
Kathol|Kathol|or|M21
Kathol Rift|Kathol|or|M21
Katraasii|Belsmuth|or|O6
Kattada||cl|M10
Kaump|Bruanii|mr|K17
Kauron|Meram|or|O4
Kavith|Corva|or|P4
Kayri||ex|I15
Kayuk|Sepan|ex|P13
Kayven||ir|M14
Kazarak|Sertar (Mahrusha)|or|S5
Kazlin|Suolriep|or|S8
Kebolar|Lahara|or|M5
Kebro|Bormea|co|L9
Kedorzha|Senex|mr|L18
Kedra||ir|L14
Keeara Major|Koros|dc|K10
Keedad|Auril|or|R7
Kegan|Calaron|or|T9
Keitum|Ariarch|mr|J6
Kejim|Sertar|or|R5
Kelada|Duluur|cl|M13
Kelarea|Tynna|ex|N14
Keldimar|Tharin|or|S7
Keldooine||hs|R10
Keller's Void||ir|L15
Kellgar|Mieru'kar|or|O3
Kellis|Terr'skiar|mr|P10
Kellux|Seitia|or|J20
Kelrodo-Ai|Steniplis|or|L18
Keltos|Irnaj|mr|K17
Keltria||co|L9
Kem Stor Ai|Tennuutta|mr|Q7
Kemal Station|Arkanis|or|R16
Kemix|Yminis|or|S14
Kemla|Dantus|or|K6
Kenari|Perkell|mr|Q7
Kendamar|Lol|or|Q18
Kennerla|Minos Cluster|or|M20
Kenosha|Tynna|ex|N14
Keptik|Carrion|or|J4
Keral|Corellian|co|M11
Kerensik Botor Enclave||co|K12
Keresia|Demetras|or|P7
Kerest|Sluis|or|M19
Kerev Doi|Circarpous|ex|O12
Kergans||ir|M14
Kerig'En|Brema|or|M17
Kerkoidia|Kira|ex|N15
Keros|Thrasybule|or|P6
Kerroc|Sarin|or|O18
Kes||co|L9
Kesh||ws|U10
Keshi|Bheriz|or|U10
Keskin|Koradin|or|J18
Kesmere|Raioballo|or|L4
Kesmere Minor|Raioballo|or|L4
Kessar|Grumani|or|N17
Kessel|Kessel|or|T10
Kessur|Dimean|ex|P13
Kestavel||cl|K9
Kestel|Mortex|or|R5
Kestos Minor|Kwymar|or|Q4
Ket|Hapes Cluster|ir|O9
Ketal||ir|L14
Ketaris|Oplovis|or|L5
Keteeria|Venaarian|mr|O7
Kethmandi|Hangshan|ex|P11
Ketz||cl|K13
Ketzali|Lannik Wilds|mr|R13
Kevan|Jalor|mr|J7
Kexeeria||cl|M12
Keyorin|Belderone|or|R6
Khadaji Singularity Corridan||co|J10
Khar Delba|Esstran (Sith Worlds)|or|R5
Kharmort's Miasma||ur|H9
Kharzet|Mortex|or|R4
Kheedar|Khuiumin|or|O18
Khemerion|Belasco|ex|P11
Kho Nai|Kalamith|or|P5
Khoan|Phelleem|or|S7
Khofar|Lahara|or|M5
Kholes|Elbaran|mr|J17
Khomm||dc|L12
Khomr|Corellian|co|M11
Khonji|Prefsbelt|or|J5
Khorm|Halori|mr|P8
Khorya||hs|S9
Khramboa||co|M9
Khubeaie|Arkanis|or|R17
Khuiumin|Khuiumin|or|O18
Khuteb|Thanium|or|S5
Kiamurr|Likasha|mr|Q15
Kidiet Olgo||co|L9
Kidir|Kuat|co|M10
Kidriff|Lostar|ex|M8
Kidron|Elrood|or|M20
Kiffex Kiffu||ir|L14
Kiilimaar|Svivreni|or|O19
Kijimi|Bryx|mr|R8
Kile|Jospro|or|S7
Kilia||ws|I8
Kiliea|Atrisian CW|co|J12
Killaniri|Wornal|mr|K17
Killisu|Ado|mr|M17
Killof|Cegul|or|L20
Killun Station|Pakuuni|or|T6
Kilmauls|Vorzyd|or|R6
Kilner|Cor'ric|or|P18
Kilotowa|Corbett|mr|I17
Kilstra|Jidlor Marches|mr|I16
Kimanan|Orus|ir|M8
Kimm Aurek|Juvex|mr|L18
Kimm Besh|Juvex|mr|L18
Kimm Cresh|Juvex|mr|L18
Kindlabethia|Braxant|or|J3
Kindosorn|Lol|or|Q18
King's Galquek|Meridian|or|R7
Kinooine||ws|J21
Kinoss|Chiss Space|ur|E8
Kinrah|Onatos|mr|R15
Kintan||hs|S9
Kintarr||cl|L13
Kintoni|Ash Worlds|or|S6
Kinun Depot|Pelgrin|or|R18
Kinyen|Bes Ber Bikade|ex|L15
Kip|Chorlian|or|S4
Kir|Corporate Sector|or|S3
Kira|Kira|ex|N16
Kirdo|Tamarin|or|N19
Kiribi||cl|L9
Kirima|Elbaran|mr|J17
Kirkeide Station|Ojoster|or|N7
Kirna||cl|N10
Kiros|Ehosiq|ex|L8
Kirtania|Nembus|or|P4
Kirtarkin|Javin (Anoat)|or|K18
Kishpaugh|Iskin|mr|O16
Kismaano|Cronese Mandate|or|S6
Kiszo|Lol|or|Q18
Kitaros Nebula|Prefsbelt|or|K5
Kitel Phard|Atrisian CW|co|J12
Kiva|Venaarian|mr|O7
Kizan||ir|N8
Kktkt|Farlax|co|K10
Klaatu|Airam|or|L20
Klasse Ephemora||ur|F9
Klathos|Chorlian|or|S4
Klatooine||hs|S9
Klaymor|Druess|mr|O15
Kleeva||hs|R11
Klepthia|Tynna|ex|N14
Kler'terria||co|K12
Kli'aar|Gordian Reach|or|P5
Klonoid|Phelleem|or|S7
Kloodavia||co|K13
Kloper||ir|N9
Kluistar||cl|M8
Klynan|Klina|or|S13
Klytonia|Bheriz|or|U11
Klytus||ws|H15
Knolstee|Corporate Sector|or|R3
Knooda|Askarian|ex|O12
Knores|Senex|mr|L17
Knot Holes|Hapes Cluster|ir|O9
Ko-Longava|Hocatar|ex|P12
Koaan||ir|N8
Koba|Narrant|mr|J16
Kobal's World|Koradin|or|I18
Kobaria|Emmo|co|M12
Kobbahn|Dantus|or|J6
Koboh|Varada|or|H19
Koboth||or|R3
Koda Space Station|Wazta|or|I18
Kodai|Belderone|or|R6
Koensayr||cl|N12
Kogan|Veragi|or|L3
Koiogra|Grohl|or|R16
Kojash|Farlax|co|K10
Kokash Kokash||co|J10
Koke Frost||ws|H7
Kol Atorn|Kanz|or|N4
Kol Huro|Kanz|or|N4
Kol Iben|Arkanis|or|R16
Kolaador|Dalchon|or|R17
Kolanda Station|Yminis|or|S14
Kolatill|Kathol|or|M21
Koler||dc|L12
Kolkur|Indrexu|or|S5
Kolos|Paqwepori|mr|P15
Koltine||ws|L21
Komnor|Suolriep|or|S8
Kondoraan|Saijo|or|K20
Konkiv|Cadma|or|T8
Konos||cl|N10
Kooda Herglic|Space|cl|K13
Koolach||ir|O10
Kooriva||ir|M14
Koovis||ir|L8
Koozebane|Calaron|or|T9
Kor Anjiliac||hs|S11
Kor Bareesh||hs|S11
Kor Besadii||hs|S10
Kor Desilijic||hs|S11
Kor Gejalli||hs|S11
Kor Gorensla||hs|S10
Kor Hestilic||hs|S10
Kor Hunamma||hs|S11
Kor Jiramma||hs|S11
Kor Nasirii||hs|S10
Kor Nijiladii||hs|S10
Kor Oktanivii||hs|S11
Kor Qunaalac||hs|S11
Kor Trinivii||hs|S11
Kor Usilic||hs|S11
Kor Utoradii||hs|S11
Kor Vanderijar||hs|S11
Kor Vosadii||hs|S10
Kor-Lahvan|Corosi|or|N6
Korad|Elrood|or|M19
Korbin||ir|J14
Korbori||cl|N12
Korda||ir|O8
Kordoku|Terr'skiar|mr|P10
Kordu|Kordu|mr|L7
Korev Zaric||ir|N9
Korfanus||co|L10
Korfo||co|M9
Korlings|Kwymar|or|P4
Kormoran|Wyl|or|R4
Korphir|Gordian Reach|or|Q6
Korrilan|Daalang|mr|Q12
Korriz|Esstran (Sith Worlds)|or|R4
Korrus|Clacis|or|K4
Korseg|Grohl|or|R16
Kortatka|Croynar|ir|M14
Korteen|Kibilini|or|Q17
Koru|Neimoidia Quellor|cl|N11
Korvaii|Kordu|mr|L7
Koshaga||ws|I7
Koshi|Sevastol|mr|Q14
Kossa Prime|Kossa (Kossa Prime)|ex|O11
Kostra|Romintine|mr|Q8
Kotab||ir|N10
Kothlis|Bothan|mr|R14
Kovor|Koradin|or|I18
Kowak|Sevetta|or|S16
Kragis|Citlik|ex|O15
Krake's Planet|Demetras|or|P7
Kral'to|Demetras|or|O7
Krann|Brevost|ex|O15
Krant|Bothan|mr|R14
Kravos|Gordian Reach|or|P6
Krayiss|Esstran (Sith Worlds)|or|R5
Kreeling|Chommell|mr|O16
Krenhner Krenhner||ir|L14
Krevas|Antemeridian|or|R7
Kriekaal||ws|J14
Kril'Dor|Outer Jalor|mr|I7
Krinemonen|Calamari|or|U6
Krintrino||cl|M10
Kriselist|Wornal|mr|K16
Krmar|Tolonda|or|R17
Krnay|Vilonis|mr|O16
Kro Var||ur|H8
Kroctar Shataum||ir|N7
Kromus|Esuain|mr|P7
Kronk|Auril|or|R6
Krownest|Mandalore|or|O7
Krozurbia|Shadola|or|U8
Krugan||ir|K15
Kruskan|Colundra|or|S5
Kryger|Ado|mr|M17
Krykas|Spirva|mr|L16
Krykis|Duluur|cl|M13
Krylon|Gordian Reach|or|P5
Krystar|Manda|mr|R14
Ksiczzic|Yucrales|mr|Q15
Ktath'atn|Chopani|or|M4
Ktil|Ktilac Regions|ir|N9
Kuar|Koros|dc|K10
Kuat|Kuat|co|M10
Kubindi|Calaron|or|T9
Kudo Corvair||ir|K14
Kuliquo||ir|L14
Kullgroon|Authala|ex|P12
Kumru|Javin|or|K18
Kuna's Eye|Zuma (Moddell)|or|H16
Kuna's Fist|Zuma (Moddell)|or|H16
Kuna's Horn|Zuma (Moddell)|or|H16
Kuna's Tail|Zuma (Moddell)|or|H16
Kuna's Tooth|Zuma (Moddell)|or|H16
Kundu Minor|Steniplis|or|M19
Kupoh|Dohlbani|mr|R13
Kur|Minor|ws|I8
Kur Nebula|Elrood|or|M20
Kuras|Elrood|or|M19
Kuratooine||ws|J5
Kuratow|Brevost|ex|O15
Kurdavvia||co|M11
Kurluvion|Weneen|or|N6
Kurost|Kurost|mr|Q11
Kursid|Esstran (Sith Worlds)|or|Q5
Kushibah|Gordian Reach|or|P5
Kutag|Farlax|co|K10
Kuthic|Tharin|or|S8
Kvabja|Uoti|co|K9
Kwannot|Alderath|mr|L6
Kwapi||ws|R3
Kwenn|Kastolar|mr|R10
Kwevron|Clacis|or|K4
Kwookrrr|Mytaranor|mr|P9
KyLessia|Bes Ber Bikade|ex|L15
Kynachi||ws|J5
Kyoloria|Xappyh|or|Q3
Kyrouac||ir|K14
Kyrska|Hevvrol|mr|P15
Kyryll's World|Phelleem|or|S7
Laakonis|Glythe|mr|J7
Laakteen Depot||cl|L13
Laboi|Suolriep|or|S8
Ladarra|Gordian Reach|or|P5
Ladro||cl|J13
Laecor|Kallea|or|K21
Laerdocia|Dalonbian|or|L3
Laertos||ir|L14
Lafete|Tunka|or|I18
Lafra|Wyl|or|R4
Lah'mu|Raioballo|or|L3
Lahag Erli Cantons of Lahag||ex|J15
Lahn|Noonian|or|M6
Lahsbane|Onatos|mr|R15
Laim|Rayter|or|J19
Lakra||ws|I6
Lali||co|L13
Lalmy'ash|Hapes Cluster|ir|O9
Laman||cl|L13
Lamaredd||ws|S18
Lambaria||cl|M13
Lamman||co|M11
Lamuir|Tapani|cl|L13
Lamus|Sertar|or|R5
Lan Barell|Hook Nebula|or|O18
Landor|Thesme|or|O6
Langhesa|Meram|or|P4
Langoona||hs|S10
Langsha-Raang|Tamarin|or|N18
Langston|Kira|ex|N15
Lanjer|Rseik|or|N19
Lankashiir||cl|N11
Lannik|Lannik Space|mr|R13
Lanos|Tandon|mr|Q14
Lansend||ir|N12
Lansono||co|L12
Lant|Tharin (Periphery)|or|S8
Lanteeb|Bri'ahl|or|I17
Lanthe|Var Hagen|mr|M16
Lanthrym|Elrood|or|M20
Lantillies|Lantillian|mr|P8
Lanz Carpo||co|M11
Lapez|Esstran|or|Q5
Laramus|Parmic|or|P18
Laria|Rseik|or|N19
Las Lagon||ir|M13
Lasan||ws|P20
Lastelle|Tapani|cl|L13
Lasten||co|L13
Lateron|Talcene|mr|Q8
Latoma|Brak|ex|O14
Latza|Spirva|mr|K17
Lau|Meerian|or|O6
Laud|Brak|ex|O14
Lavisar|Strabin|mr|M7
Lazerian|Kira|ex|N15
Leafar|Greater Plooriod|ex|M7
Lechra Lixal||ir|M14
Ledalau||co|L12
Ledeve||ex|I7
Lekua|Centrality|or|T8
Lelmra|Churba|mr|P14
Lemmi|Hapes Cluster|ir|O9
Lenahra|Velcar|or|J5
Lengil|Bes Ber Bikade|ex|L15
Lenico|Cademimu|or|L6
Lenniera||co|M10
Lenthalis|Spirva|mr|L17
Leonit|Cyrillian Protectorate|ex|O12
Leoxo|Rayter|or|J19
Lequabis||ex|I14
Lerct|Prackla|ex|O8
Leresen|Lannik Wilds|mr|R13
Leria Kerlsil||co|M10
Leritor|Yucrales|mr|Q15
Lespectus||co|M10
Lessa|Mytaranor|mr|P9
Lesser Sloo Gas Cloud|Sloo|mr|P14
Lesser Tontakoh|Klina|or|S13
Lessuris|Pelgrin|or|R17
Lesu|Dail|or|Q18
Letaki|Steniplis|or|L19
Letev|Tapani|cl|L13
Lettow||co|M11
Levian||ir|N8
Lew'el||ws|J3
Lexas Prime|Kessel|or|U10
Lexrul|Trax|mr|Q10
Lexus|Thrasybule|or|P6
Leyaki|Tregillis|ex|M15
Leyoye|Elochar|mr|R9
LFA-509|Thaere|ex|P14
Lhosa||ir|N8
Li-Toran||ir|M13
Lialic||dc|K12
Lianna|Allied Tion|or|S6
Liaq||co|M11
Licha In|Veragi (Gree Enclave)|or|L2
Ligna|Corva|or|P4
Liinade|Ciutric|or|N5
Liintaar|Gaulus|or|R17
Likasha|Likasha|mr|Q14
Linasals|Mikaster|ex|N15
Linuri|Doldur|mr|P15
Lioaoi Lioaoin|Space|ur|E7
Liok|Ciutric|or|N5
Lipsec|Koradin|or|I18
Lira San||ws|O20
Lirra|Baxel|or|U12
Lisal|Sarka|mr|Q8
Liskan|Ojoster|or|N7
Lissam|Rayter|or|J18
Listehol|Kwymar|or|Q4
Listoria|Tapani|cl|L13
Little Atullus Anthos||ir|N8
Little Capella|Gordian Reach|or|Q6
Little Kessel|Kessel|or|T10
Little Petrovi|Yushan|mr|K17
Little Talhovi|Juvex|mr|K18
Liul|Demetras|or|P7
Livien|Tion Hegemony|or|S5
Livno||ws|J21
Livorno|Belderone|or|R6
Llanic|Karthakk|or|Q16
Llewebum|Rolion|or|Q7
Llon Nebulae|Itopol|ex|K15
Llorkan||ir|N10
Lo'Uran|Aparo|or|R3
Loac|Hocatar|ex|P12
Lobaoc|Mieru'kar|or|N3
Lobaq Station|Rolion|or|Q7
Loce||ws|S4
Lockest|Palamut|ex|N13
Loedorvia Weemell||co|K12
Lofquar|Chommell|mr|O17
Logal Ri|Chaama|mr|J7
Lohopa|Boeus|ex|M15
Loit|Cegul|or|M20
Loj||cl|M9
Loken|Bryx|mr|R7
Lokondo|Braxant|or|J3
Lokori|Karthakk|or|Q16
Lokud|Chopani|or|L3
Lol|Lol|or|Q18
Lola Sayu|Belderone|or|R6
Lolet|Haserian|mr|Q14
Loletia|Ojoster|or|N7
Lolnar||co|M11
Lomabu|Aida|mr|Q13
Lonania|Kossa|ex|O11
Lonatro|Veragi (Gree Enclave)|or|L3
Londor Londori||mr|J7
Lonera||ir|O12
Long Shadow|Kallea|or|K21
Longwind|Trax|mr|Q10
Lonjair Prime|Danjar|or|M19
Lonnaw Droma||mr|K6
Lontar||cl|J9
Loovria|Juvex|mr|L18
Loped||ir|O9
Lopor Station|Spirva|mr|K17
Loposi|Dustig|mr|M17
Lorahns|Sloo|mr|P14
Lorahns Cavity|Sloo|mr|P14
Lorardia|D'Astan|or|O6
Lorattick Nebula|Esstran|or|Q5
Loratus|Sanbra|or|O17
Lorell||ir|O9
Lorenz|Tapani|cl|L13
Loreth|Saijo|or|K20
Loretto||co|M11
Lorimax|Fakir|cl|K9
Lorista|Glythe|mr|J7
Lorn|Dalchon|or|R17
Loronar||cl|M12
Lorpfan|Tynquay|or|R4
Lorrad|Allied Tion|or|S6
Lorrd|Kanz|or|N4
Lorta|Gendius|mr|J17
Lost Clusters||ws|I20
Lost Murvey||ws|H6
Lost Souls|Cademimu|or|L6
Lota|Brak|ex|O14
Loth||ir|J8
Lothal|Lothal|or|U7
Lotho Minor|Wazta|or|I17
Lotide|Mortex|or|S5
Lovetus||co|L9
Lovola|Hapes Cluster|ir|O9
Low'n|Romintine|mr|Q8
Lower Flora|Cloud|ir|I14
Lowick|Calaron|or|U9
Lowik|Cadavine|or|P17
Lozash|Bes Ber Bikade|ex|L15
Lubang Minor|Illisurevimurasi|or|Q4
Lucazec|Nuiri|or|Q6
Lucrenn|Skine|or|Q19
Lucrusia|Seswenna|or|M18
Luduria||cl|M12
Luj|Tamarin|or|N19
Lujo||co|L12
Luminous Magnificence||ws|H14
Lupal||ws|G20
Lupani|Tapani|cl|L13
Luprora||ur|G7
Luptoom|Seswenna|or|M18
Lur|Aparo|or|R4
Lurania||cl|N10
Luristan||ir|M14
Lurr|Rayter|or|J19
Lusaanda|Meram|or|O4
Lusdu|Alderaan|co|M10
Lusk|Tapani|cl|L13
Lust||ws|J20
Lutrillia|Javin (Yarith)|or|J18
Luudria|Dalchon|or|R17
Luuhar|Hapes Cluster|ir|O9
Luuq Luuq||mr|L7
Luxiar|Bon'nyuw-Luq|or|N18
Luzalite||co|L9
Lwhekk Ssi-ruuvi|Space|ur|C16
Lybeya|Bajic|or|P18
Lyjdaa|Kwymar|or|Q4
Lynos|Mortex|or|R4
Lynx|Tapani|cl|L13
Lyran|Quiberon|or|S15
Lysatra||ws|I8
Lythia|Suolriep|or|S8
Lythos|Corporate Sector|or|S3
M'Bardi|Kalamith|or|P5
M'dweshuu Nova||hs|S9
M'haeli|Majoor|ex|N15
M'Hanna||hs|T11
M132L4||ir|K8
M2934738|Tragan Cluster|or|N5
M4-78||ir|O9
Ma'alkerr|Rago|mr|I7
Ma'ar Shaddam|Rseik|or|N20
Maarka|Perkell|mr|Q7
Maateen||ir|O10
Maccent|Phelleem|or|S7
Mackar|Hewett|mr|M6
Madurs|Maldrood|mr|R7
Maelstrom Nebula|Relgim|or|K5
Maerdocia|Maerdocian|mr|Q13
Magagran|Halthor|or|L6
Magar's World|Stensen|or|H17
Magataran Maelstrom||ir|N7
Magaveene|Prefsbelt|or|K6
Magmar||co|M10
Magna||ws|G14
Magnus Horn|Talcene|mr|Q8
Magravia|Karthakk|or|Q17
Maher||ur|G7
Mahranee|Taldot|mr|P8
Maicombe|Corthenia|mr|K7
Maill|Cadavine|or|P17
Mairenhelm|Dona Laza|ex|P9
Maires|Hapes Cluster|ir|O9
Mairne|Kathol|or|M21
Majilop|Lol|or|Q18
Majoor|Majoor|ex|N15
Majoros||ir|O8
Makeb|Aida|mr|Q13
Makem Te|Nilgaard|or|S5
Makksre|Uoti|co|K9
Mako-Ta|Noonian|or|M6
Makthierse|Cegul|or|L20
Malachor|Chorlian|or|S4
Maladi Maladi||ex|O12
Malador|Juvex|mr|L17
Malaga Cluster|Steniplis|or|L19
Malagarr||ws|V8
Malano||cl|N10
Malanose|Veragi (Gree Enclave)|or|K2
Malari|Churnis|mr|I6
Malastare|Dustig|mr|N16
Malathon|Ghost Nebula|ex|P10
Maldo Kreis|Arkanis|or|R16
Maldovea|Brema|or|M17
Maldra|Shadola|or|U8
Maldroth|Grumani|or|N17
Maleinator|Great Agash|ex|K15
Malenko|Eidoloni|mr|L16
Malian||ex|I14
Malicar|Mieru'kar|or|N4
Malkii|Mortex|or|S5
Mall'ordian|Corporate Sector|or|R3
Malloran|Garis|or|N18
Malo|Sluis|or|M19
Malpassia||co|L10
Malpaz|Wazta|or|I17
Malrev|Thrasybule|or|P6
Malsuum||ir|L14
Maltha Obex|Mieru'kar|or|O3
Maltheen Divide|Trax|mr|Q10
Malthor|Tandon|mr|Q14
Maltorian|Lifh|mr|R8
Maltorra||co|M12
Malus|Gaulus|or|S17
Mamendin|Farrfin|co|K9
Mamkoda|Cassander|or|L5
Manaan||ir|O11
Manakron|Tashtor|mr|I16
Manali|Imberlin|ex|P14
Manari|Brevost|ex|O15
Manaxia||co|M10
Manda|Manda|mr|R15
Mandalore|Mandalore|or|O7
Mandell|Bothan|mr|R14
Mandellia|Nuiri|or|Q7
Mandrine|Kessel|or|T10
Manella||co|M9
Manforgon|Senex|mr|L17
Mangan||cl|J9
Mangez|Brak|ex|O14
Mannius||ws|I14
Mannova|Gordian Reach|or|Q5
Manoe Manoe||mr|K7
Manpha|Seitia|or|K20
Manress||ir|N9
Mantan|Calamari|or|U6
Mantarran||ir|L14
Mantessa|Orus|ir|M8
Mantilorr|Suolriep|or|S10
Mantooine|Atrivis|or|L5
Manwess Kilbanis||cl|N9
Maphus Tria|Cadma|or|T8
Mapuzo|Hollan|mr|M7
Marais, The Hatawa||co|J10
Maraken|Oktos|mr|R12
Maramere|Karthakk|or|Q17
Marasai Marasa|Nebula|ir|O10
Marasaln|Outer Jalor|mr|I7
Marca|Meerian|or|N6
Marcadia||ir|N14
Marcelan|Prime|ws|J5
Marcol Void|Kathol|or|M21
Mardona||ir|N13
Mareg||ws|I20
Marfa||co|M10
Maridun|Rolion|or|Q6
Markbee's Star|Atrivis|or|L5
Markez Tiala||mr|K7
Markon||co|L9
Marleyvane|Tharin|or|T8
Marmoth|Albarrio|or|K4
Marngar||co|M10
Maro Della|Mektrun|mr|L17
Marotan||ir|O9
Marquarra|Prefsbelt|or|J5
Marquinn||ir|K8
Marranis|Esstran|or|P5
Marrovia|Gordian Reach|or|P5
Martaus||ir|N8
Martle Station|Indrexu|or|S5
Maryo|Corporate Sector|or|S4
Maryx Minor|Sujimis|or|O19
Marzoon|Marzoon|mr|I16
Masgen|Churnis|mr|I7
Masposhani|Taldot|mr|Q9
Massiff|Nebula|co|K9
Massoss||ur|G8
Masterra|Hertae|mr|Q14
Matabre|Eucer|mr|Q7
Matacorn|Lambda|mr|P15
Mataou|Javin (Anoat)|or|K18
Matarri||ir|N8
Mathas||ir|J14
Matra|Corporate Sector|or|S4
Matterhelm||ir|N9
Mattri||ir|O10
Mauk|Metatessu|mr|R9
Maun Digitalis||cl|L8
Mauphin||co|K12
Mavinia||ir|N13
Mavva|Aparo|or|R3
Maw Cluster|Kessel|or|T10
Mawan||co|M11
Maxca|Brak|ex|O14
Maxet|Tragan Cluster|or|N5
Maxilia|Vulcusion|ex|L16
Maya Kovel|Zuma (Moddell)|or|H16
Mayagil|Mayagil|or|M18
Mayvitch|Immalia|ex|L8
Mazhar|Spadja|or|R6
Mazuma|Nuiri|or|Q6
Mearalis|Bri'ahl|or|I17
Meastrinnar||ir|K8
Mechis||ir|L14
Medepiest|Lambda|mr|P15
Media|Corporate Sector|or|S4
Medoslea||ir|O8
Medth|Ado|mr|M17
Meedis Minor|Tandon|mr|Q13
Mefti||cl|L8
Megalox Beta|Bes Ber Bikade|ex|L15
Megaria||ir|M8
Meglumine||ir|J8
Mek va Uil|Surron|ex|O13
Mek-Sha|Belderone|or|R6
Mek'tradi|Baroli|ex|N14
Mektrun Cluster|Mektrun|mr|L17
Melagawni|Likasha|mr|Q15
Melahna||co|K9
Melasaton|Jjannex|or|L18
Melchior|Zeemacht Cluster|ir|N8
Meldazar|Immalia|ex|K8
Melida/Daan|Cadavine|or|P17
Meligin|Ehosiq|ex|L8
Melinz||co|L9
Melldia|Esstran|or|Q4
Melm|Wyl|or|S4
Melnea's World|Arkanis|or|R16
Melus|Nicandra|mr|L7
Mendacia|Fei Hu|mr|P13
Mendavi|Ferra|or|S16
Mendenbatt|Mortex|or|R5
Mendicat||ws|I8
Mengal|Gordian Reach|or|Q6
Mengjini|Bright Jewel|mr|L7
Mennar-Daye|Thesme|or|O6
Mentanar Vosk|Nijune|or|O4
Menthusa||cl|M9
Meor Ain|Jubilar|or|T7
Mepha'as Prime|Belsmuth|or|O6
Mephitis||cl|J13
Mephout Mephout Dominion*||ws|H20
Merakai||co|K9
Meria||mr|H15
Meridian|Meridian|or|R7
Merikon|Fath|or|K6
Merisee|Elrood|or|M19
Merj|Thesme|or|O6
Merokia|Koradin|or|J18
Merren|Chaykin|ex|O14
Merson||ir|O10
Merthia|Merthian|ex|N13
Meruud|Narrant|mr|I16
Mes Cavoli|Venaarian|mr|O7
Meserian|Nijune|or|O4
Meshakia|Likasha|mr|Q14
Messert|Mytaranor|mr|Q10
Messia||co|M11
Mestare||dc|L12
Mestra|Minos Cluster|or|M20
Mestun|Thrasybule|or|P6
Mesula|Eidoloni|mr|M16
Metagos|Cadma|or|T8
Metalorn|Talcene|mr|R8
Metellos|Corusca|co|K10
Metharg|Hook Nebula|or|O17
Metharian Nebula|Tantra|or|M19
Metlok|Nouane|ir|N8
Mev|Javin (Anoat)|or|K18
Mexeluine|Javin (Anoat)|or|K18
Mezeg|Mezeg|mr|N7
Mhalanduin|Oktos|mr|R12
Mhatma||mr|I16
Mhettghar|Atravis|or|L19
Midani|Thuris|or|P18
Midarr|Mulgard|mr|N16
Midgor|Croynar|ir|M14
Miekos|Cegul|or|L20
Miele Nova||co|L9
Miglar|Morshdine|or|O4
Mijos|Javin (Anoat)|or|K18
Mika|Arkanis|or|R17
Mikaster|Mikaster|ex|N15
Mikkia|Greater Plooriod|ex|M7
Miko|Esaga|mr|Q11
Mil Velay||ir|M8
Mila|Brak|ex|O14
Milagro|Chaykin|ex|O14
Milarian|Trans-Nebular|mr|R16
Mileva|Maldrood|mr|R7
Millinar|Hapes Cluster|ir|O9
Milvayne||ir|L8
Mima|D'Aelgoth|mr|L17
Mina-Rau|D'Astan|or|O6
Minashee|Cassander (Tadrin)|or|K5
Minavar|Bheriz|or|U10
Mindabaal Faultheen||ir|J13
Mindemir||cl|N10
Mindor||ir|M8
Minfar||ir|I13
Minkring|Shelsha|cl|M9
Minntaa|Nilgaard|or|S5
Minntooine|Calamari|or|T6
Minoth|Masla|mr|J17
Mirak|Major|ir|M14
Mircapala||ws|S3
Mirial|Illisurevimurasi|or|Q4
Miriatin|Var Hagen|mr|M16
Mirit||cl|K9
Mirnic|Seswenna|or|M18
Miro|Fath|or|K6
Mirran Morobe||cl|N11
Mirrin Prime|Kalamith (Mirrin)|or|P5
Mirshaf||co|L9
Mirshilan|Dalchon|or|R17
Mis-Tenek|Manda|mr|S15
Misnor|Meram|or|O4
Mistar|Tragan Cluster|or|N5
Mitek-Por||ir|M8
Mittoblade||ir|K8
Miv'rah|Gaulus|or|R17
Mizra||ir|O8
Miztoc|Irnaj|mr|K17
Mobetta|Airam|or|M20
Modus|Hapes Cluster|ir|O9
Moer|Hewett|mr|M7
Mogoshyn|Gordian Reach|or|P5
Mohsenia|Meridian|or|R6
Mokivj|Pacanth Reach|or|G16
Mokk||ir|N10
Mol'leaj|Thaere|ex|O14
Molavar|Abrion|or|S15
Moldour|Lothal|or|U7
Mollo Tanka|Corellian|co|M11
Molos|Stensen|or|I17
Moloskia|Mbandamonte|ex|N15
Moltok|Atrivis|or|L5
Momansi|Brevost|ex|O15
Mon Cala|Calamari|or|U6
Mon Gazza|Lambda|mr|Q16
Mon Torri|Msst|mr|P7
Monadin|Kuat|co|M10
Monastery|Haserian|mr|Q14
Mondress Mondress||ex|J7
Monhudle|Cassander (Tadrin)|or|K5
Monic|Trianii Space|ws|R3
Monnoc|Rseik|or|N19
Monor|Doldur|mr|P15
Monsua Nebula|Zuma (Moddell)|or|H16
Monta|Daimar|mr|Q16
Montalsia|Corellian|co|M11
Montitia|Montitian Grant|ex|J15
Montross|Truum|mr|P8
Moobia|Kastolar|mr|R10
Moog Mot|Tharin|or|S8
Mooga|Perkell|mr|Q7
Moonflower|Nebula|ws|U16
Moonus Mandel|Bothan|mr|R14
Moorja||ir|L15
Moorjhone|Jospro|or|R7
Mooshie Cluster|Videnda|or|L18
Moraband|Esstran (Sith Worlds)|or|R5
Morado|Hune|mr|Q11
Moraga|Oricho|or|M5
Morak||ws|H18
Moralan||hs|T10
Morath Nebula Hatawa||co|J10
Moravia|Lambda|mr|Q16
Moraysi|Skine (Moraysian)|or|P18
Mordagon|Authala|ex|P12
Mordal|Illisurevimurasi|or|Q4
Mordis|Lambda|mr|P16
Morellia Morellian CW*||ws|S3
Morgania|Yminis|or|S14
Morishim|Albarrio|or|K5
Morning's Bell|Farlax|co|K10
Moro|Rago|mr|I7
Morogia||co|M10
Morseer|Quelii|or|O6
Morton|Majoor|ex|N15
Morturia|Relgim|or|L4
Morvogodine|Calaron|or|T9
Moseum|Thesme|or|O6
Moshaw|Seswenna|or|M18
Moskk|Albarrio|or|K5
Mossak|Thanium|or|R6
Motexx||cl|M13
Mourushia|Barsa|mr|J6
Movris|Noonian|or|M6
Mowgle|Demophon|co|M10
Mrinzebon|Sombure|mr|K16
Mrisst|Fakir|cl|K9
Mrlsst|Tapani|cl|L13
Msst|Msst|mr|P7
Mugaar|Bruanii|mr|K18
Mulatan||hs|S10
Muldore||co|J9
Mulita||ws|H19
Mullan|Keldrath|or|T6
Mulvar|Obtrexta|or|K3
Munlali Mafir||ur|G5
Munt Ontdal|Fei Hu|mr|Q13
Munto Codru|Pakuuni|or|T6
Muntro|Mayagil|or|N18
Muntuur|Sloo|mr|P14
Mupin|Rocantor|ex|L15
Muqular|Montitian Grant|ex|J15
Murakam||dc|M11
Murgo||ws|I7
Murk|Zuma (Moddell)|or|H16
Murkhana|Auril|or|S6
Murninkam|Corva|or|O3
Musca|Merthian|ex|N14
Muskree|Colundra|or|S5
Musson|Karthakk|or|Q16
Mussubir|Senex|mr|L17
Mustafar|Atravis|or|L19
Muunilinst|Obtrexta|or|K4
Muuria||ir|M13
Muzara|Trestis|ex|K8
Muzzli|Citlik|ex|O15
Mycroft|Fakir|cl|K9
Mydasos|Dalicron|or|K19
Mygeeto|Albarrio|or|K5
Mykapo|Ash Worlds|or|T7
Mylok|Airam|or|L20
Mynock 7 Station|Mayagil|or|M18
Mynos|Dalchon|or|R17
Myomar|Deadalis|ex|J7
Myrenia||co|L9
Myrkr||ir|N7
Mytar|Dufilvian|mr|Q15
Mytaranor|Mytaranor|mr|P10
Mytus||ws|S3
MZX32905|Kanz|or|N4
N'dian|Spadja|or|R6
N'ildwab|Tynquay|or|Q4
N'zoth|Farlax|co|K10
Naalol|Spirva|mr|L17
Naator|Var Hagen|mr|M16
Naboo|Chommell|mr|O17
Nacon||dc|L10
Nacronis|Hollan|mr|M7
Nadaav||ir|M8
Nadhe|Rolion|or|Q6
Nadiem|Baxel|or|U11
Nadiri|Bormea|co|L9
Nag Ubdur|Demetras|or|P7
Nagoa||ws|O3
Nahsu Minor|Ktilac Regions|ir|N9
Najan-Rovi|Brema|or|M17
Najarka|Rayter|or|J19
Najiba|Arkanis|or|R17
Nak Shimor||cl|M9
Nakadia|Tregillis|ex|M15
Nakrikal Singularity|Grumani|or|N17
Nal|Hutta|hs|S12
Nal Kapok|Taldot|mr|Q9
Naldar|Phelleem|or|S7
Nalrith|Rseik|or|N20
Nalyd|Tharin|or|S7
Nam|Chorios Meridian|or|R6
Nam Priax|Nilgaard|or|S5
Nam'ta|Atrivis|or|L5
Namadii|Churnis|mr|I6
Nameel|Mytaranor|mr|Q10
Namore||cl|L13
Namzor|Esuain|mr|P7
Nanta-Ri|Farlax|co|K10
Nantama|Senex|mr|L17
Nanth'ri|Kurost|mr|Q12
Nantoon||cl|M13
Nantuker|Hapes Cluster|ir|O9
Naos||ws|S18
Naplousea|Tynquay|or|R4
Naporar|Chiss Space|ur|F8
Naps Fral Cluster|Ferra|or|S16
Nar Bo Sholla||hs|R10
Nar Chunna||hs|S10
Nar Haaska||hs|T11
Nar Kaaga||hs|S13
Nar Kanji|Suolriep|or|S9
Nar Kreeta||hs|S10
Nara||cl|L9
Naraka|Phelleem|or|S7
Naran-Shiv Tacuni||ex|O15
Naratar|Wornal|mr|K16
Narg|Rayter|or|J19
Narigus|Belsmuth|or|O6
Narkina|Abrion|or|S15
Narq||cl|N11
Narragader|Kibilini|or|Q17
Narrant|Narrant|mr|J17
Nars|Senex|mr|L17
Narth|Mayagil|or|N18
Narvath|Narvath|ex|O14
Natalon|Piryn Shar|ex|K16
Nath Goordi|Tennuutta|mr|Q7
Nathas Questal||co|J12
Nathema|Chorlian|or|S4
Natinati||ws|S4
Nativum|Halla|mr|R9
Nauton|Taldot|mr|Q9
Nazzri|Lantillian|mr|P9
NCW-781||ws|H18
Nea Dajanam|Sern|cl|L13
Near Indosa|Gordian Reach|or|P6
Near Pando||hs|S14
Neary|Calaron|or|T9
Nebula Forso|Meram|or|P4
Necr'ygor|Chommell|mr|O16
Necropolis|Zuma (Sugai)|or|H16
Nedij|Samix|or|Q19
Needan||ws|I20
Neelabi|Kibilini|or|Q17
Neelanon|Senex|mr|L17
Neelgaimon|Xappyh|or|Q3
Nefitifi|Wazta|or|J18
Nefri|Ciutric|or|N5
Neijaia|Majoor|ex|N15
Neimoidia|Quellor|cl|M10
Neka|Raioballo|or|L4
Nela-Ray|Kalamith|or|P5
Nelfrus|Elrood|or|M20
Nelgenam|Tashtor|mr|I16
Nella|Tapani|cl|L13
Nellac Kram|Bon'nyuw-Luq|or|N18
Nelvaan|Savareen|or|Q16
Nelvana Gas Cluster|Iskin|mr|O16
Nentan|Glythe|mr|K7
Nenyezh|Halori|mr|P7
Neoli||ws|O20
Neona|Tapani|cl|L13
Nephryn|Prackla|ex|O8
Nepotis|Calaron|or|T9
Nepoy|Senex|mr|L17
Neral|Corellian|co|M11
Neree|Suolriep|or|S9
Nerria|Suolriep|or|S9
Nerrif|Vilonis|mr|O16
Neshei Neshei||ex|J8
Neshtab Quohag||ir|K8
Neskar|Tashtor|mr|I16
Nessem|Lostar|ex|M8
Netalych||ir|N14
Netolio|Tapani|cl|L13
Nettehi Paataatus Hiveborn*||ur|F9
Neutra Oeiros||ex|P10
Neuvia||cl|L9
Nevarro|Dalicron|or|K20
New Agamar|Sprizen|or|N5
New Alderaan|Ash Worlds|or|T6
New Apsolon|Terr'skiar|mr|P10
New Ator|Arkanis|or|R16
New Bakstre|Cassander (Tendrannan)|or|K5
New Balosar|Arc d'Stot|ex|K15
New Bornalex|Belsmuth|or|O6
New Brampis||ir|M13
New Brigia|Farlax|co|K10
New Canistel|Demetras|or|P7
New Cov|Churba|mr|P14
New Cylimba|D'Aelgoth|mr|L17
New Drev'starn|Thesme|or|O6
New Heurkea|Calamari|or|U6
New Holgha|Ciutric|or|N5
New Holstice|Maldrood|mr|R7
New Javis|Tapani|cl|L13
New Parsh|Perinn|or|J4
New Plympto|Corellian|co|M11
New Polokia||ir|M13
New Raithal Annecy||ex|P9
New Ralltiir|Lantillian|mr|P8
New Shella|Tapani|cl|L13
New Valis|Bri'ahl|or|I17
Nexator||ir|O10
Nexer|Prackla|ex|O8
Nexus Ortai|Hertae|mr|Q14
Nez Peron|D'Astan|or|O5
Nezni|Mayagil|or|N18
Nfolgai|Esstran (Sith Worlds)|or|R4
Nharqis'l|Veragi|or|K2
Niamos|Vorzyd|or|R6
Nibiru|Zuma (Kakani)|or|H16
Nicandra|Nicandra|mr|M7
Nichen|Morshdine|or|N4
Nicht Ka|Esstran (Sith Worlds)|or|R5
Niele||cl|K13
Nierport||cl|L8
Nieuth|Wyloff|cl|L8
Nigel|Kira|ex|N16
Nightsend|Phelleem|or|S7
Nightside|Sertar|or|R5
Niian|Thaere|ex|O14
Nijune|Nijune|or|N5
Nilash|Grumani|or|M17
Nilg|Alderath|mr|L7
Nilgaria|Masla|mr|J16
Nim Drovis|Meridian|or|R7
Nimat|Tharin|or|T8
Nimba||ws|T17
Nimban||hs|S10
Nimgorrhea|Yminis|or|S14
Nimia||hs|S9
Ningoth|Karthakk|or|Q16
Ninn|Corporate Sector|or|R3
Ninzam|Ryndellian|mr|P17
Niorven|Lambda|mr|P16
Niran|Tunka|or|I18
Nirauan||ws|I5
Niraya||ir|N9
Nirellia|Oktos|mr|Q11
Niro|Circarpous|ex|O12
Nishmar||ws|G15
Nishr|Hunnoverrs|or|R17
Nista|Tapani|cl|L13
Nithorni||cl|K8
Nivek|Citlik|ex|O14
Nixor|Eclorar|mr|Q12
Nixus|Parmic|or|P18
Nkllon|Alchenaut|ex|L16
No-ad|Bryx|mr|R7
Noaxson|Oricho|or|M6
Nocto|Airam|or|L20
Noctralis|Ehosiq|ex|L8
Noctu||cl|J13
Nodgra|Airam|or|L20
Noe'ha'on|Piryn Shar|ex|K16
Nojic|Nojic|ex|O9
Nolar||ir|N8
Nomaria|Suolriep|or|S8
Nomlis|Vilonis|mr|O16
Noola|Relgim|or|L5
Nooli|Noolian|mr|Q13
Noomis Riga|Yminis|or|S14
Noonar|Noonian|or|M6
Noopiths, The|Bozhnee|or|L18
Noori|Noori|ex|O10
Nooroyo|Cadavine|or|P17
Nopachi||co|M10
Nopces|Bormea|co|L9
Nopsin||mr|I15
Noquivzor||cl|K9
Nora|Belshar|mr|J7
Norah||ir|L14
Norat|Farlax|co|K10
Norclune||cl|L8
Nord|Kanz|or|N4
Nordis Prime|Tashtor|mr|J16
Nordra||ir|N14
Noremac|Kanz|or|N4
Noris|Chiss Space|ur|F8
Norisyn|Svivreni|or|O19
Norkronia||co|K10
Norne||co|K10
Norsid|Rseik|or|N19
Norulac||ir|O9
Norval|Calaron|or|T9
Noryath|Nuiri|or|Q6
Noryokon||ir|K8
Nosken|Prefsbelt|or|J6
Notak|Doldur|mr|P15
Nothoiin|Javin (Anoat)|or|K18
Notonia|Illisurevimurasi|or|Q4
Nouane|Nouane|ir|N8
Noult||co|L12
Nova Garon|Rayter|or|J19
Novar|Lostar|ex|M8
Novi|Hapes Cluster|ir|O9
Novka|Manda|mr|R14
Novoil|Cluster|cl|N12
Novolek Beacon|Tharin (Periphery)|or|S8
Novor|Tharin (Periphery)|or|S8
Nuala|Trans-Gascon|mr|P7
Nubia|Corellian|co|M11
Nuja|Axion|ex|P10
Nulan|Hook Nebula|or|O18
Null|Trans-Vulta|mr|N7
Numatra||co|L12
Numidian Prime|Bright Jewel|mr|L7
Nummunr|Ash Worlds|or|S7
Nunce||co|L13
Nuralee|Tyus|mr|N16
Nurasenti|Abrion|or|S15
Nuswatta|Cronese Mandate|or|S6
Nuvar|Dustig|mr|N17
Nux|Endocray|mr|R14
Nwarcol|Tharin (Periphery)|or|S8
Nyara||ir|L8
Nyarikan Nebula|Msst|mr|P7
Nyasko|Phelleem (Colunda)|or|S7
Nyemari|Meridian|or|R6
Nymalia|Eidoloni|mr|M17
Nyny|Ash Worlds|or|T7
Nyonpur|Daimar|mr|Q16
Nyriaan|Trans-Vulta|mr|N7
Nyssa|Tapani|cl|L13
Nysza|Dalchon|or|R17
O'reen||ur|H13
Oaka|Prime|ir|J8
Oanne|Bon'nyuw-Luq|or|N17
Oba Diah|Kessel|or|T10
Obana|Arkanis|or|R16
Obas|Andirma|ex|L15
Obelia|Tapani|cl|L13
Oben||ws|J4
Obica|Grumani|or|M17
Obinipor|Demetras|or|P7
Obran Cluster|Videnda|or|L18
Obredaan|Irishi|mr|K6
Obroa-skai||ir|N8
Obsidia||ur|G7
Obulette|Tapani|cl|L13
Obumubo||co|L13
Obus||ws|I4
Ocahont|Alui|mr|N17
Ochotl|Airam|or|L20
Ocktai|Kriz|or|K19
Ocsin|Corporate Sector|or|S3
Octavia|Nicandra|mr|M7
Octero|Portmoak|or|P18
Odacer-Faustin|Esstran (Sith Worlds)|or|Q5
Odessen||ws|G13
Odik||dc|K11
Odona|Tolonda|or|Q17
Odos|Meridian|or|R7
Odryn|Noonian|or|N7
Odynnia Gavo|Bryx|mr|R7
Oetchi|Bon'nyuw-Luq|or|N17
Öetrago|Mayagil|or|M18
Off-Canau||cl|N12
Ogden Minor|Maerdocian|mr|Q12
Ogem|D'Aelgoth|mr|L17
Oggustus Nebula|Kira|ex|N15
Ogoth Tiir|Atravis|or|L19
Ohratuu|Piryn Shar|ex|K16
OHS1782-03|Ash Worlds|or|T7
OHS2132-04|Ash Worlds|or|T7
OHS3842-03|Ash Worlds|or|T7
OHS4140-02|Ash Worlds|or|T7
Ojom||dc|M11
Okator|Eucer|mr|Q7
Oko E|Wazta|or|J18
Oktaro|Lannik Space|mr|R13
Oktos|Nebula|hs|R12
Okyaab|Ojoster|or|N7
Olabria|Seitia|or|J20
Olanji|Hapes Cluster|ir|O9
Old Barag|Epsi Collective|ex|M15
Old Mankoo|Quess|mr|N17
Olega|Esuain|mr|P7
Oligtaz||co|L12
Oliu|Jubilar|or|T7
Olkrastrus Numesira||mr|Q9
Omaka|Dalchon|or|R17
Omar||cl|K13
Omereth|Albanin|or|U13
Omiddelon|Halla|mr|S9
Omman|Tion Hegemony|or|S6
Omman Minor|Kibilini|or|Q17
Omonoth||ir|M8
Ompersan|Prefsbelt|or|K5
Omphalos|Venaarian|mr|O7
Omwat|Garis|or|N18
Onadax|Minos Cluster|or|M20
Onatos|Onatos|mr|R15
Ondara|Lantillian|mr|P8
Onderia||ir|M13
Onderon Japrael||ir|O9
Ondo||cl|N12
Ondos||co|K10
Ongary|Ividal|mr|P14
Ongella||ir|N10
Onod|Irnaj|mr|K17
Ontotho|Nembus|or|P4
Ookbat|Kastolar|mr|Q10
Ool|Chiss Space|ur|E8
Oolex Pulsar|Sumitra|ex|N7
Oolidi|Hythrope|ex|M16
Ooloponi|Bes Ber Bikade|ex|L15
Oon|Lothal|or|U7
Oon Tien|Kathol|or|M21
Ooo-sek|Daimar|mr|Q16
Ooo-temiuk|Arkanis|or|R16
Oor|Cronese Mandate|or|S6
Oordo|Strabin|mr|M7
Oorn Tchis|Lahara|or|M5
Oosalon|Baxel|or|U12
Ootoo Prime|Tungra|or|K18
Ootoola|Morshdine|or|O5
Oovo|Tharin|or|S8
Oovri|Tungra|or|K18
Opari|Dustig|mr|N16
Opatajji Alsaka||co|L9
Open Sea|Centrality|or|U8
Ophideraan||cl|K13
Opiteihr|Var Hagen|mr|M16
Opitha Tren||mr|J15
Oplovis|Oplovis|or|M5
Opop Hibbedit|Sevastol|mr|Q14
OR-Kappa-2722|Lahara|or|M5
Oracaia|Dantus|or|J6
Oranessan|Grumani|or|M17
Orax|Subterrel|or|L20
Orchis||ir|N8
Ord Adinorr|Meridian|or|R7
Ord Antalaha||cl|L8
Ord Biniir|Relgim|or|L5
Ord Bueri|Nilgaard|or|S5
Ord Canfre|Cassander|or|K5
Ord Cantrell|Fath|or|K6
Ord Celbus|Karthakk|or|Q16
Ord Cestus|D'Astan|or|O6
Ord Dalet|Sertar|or|R5
Ord Dorlass|Iskin|mr|O16
Ord Dycoll|Lannik Wilds|mr|R13
Ord Fanthal|Ojoster|or|O7
Ord Gimmel|Ado|mr|M17
Ord Grovner|Khuiumin|or|O18
Ord Gustald|Mytaranor|mr|Q9
Ord Hout|Brema|or|M17
Ord Ibanna|Brema|or|M17
Ord Ivarn|Hakartha|ex|L16
Ord Jannak|Kastolar|mr|R10
Ord Janon|Spinward|or|N2
Ord Klina|Klina|or|S13
Ord Lithone||ir|L8
Ord Lonesome|Albanin|or|T12
Ord Mantell|Bright Jewel|mr|L7
Ord Marsax|Belderone|or|R6
Ord Mynock|Prefsbelt|or|K6
Ord Namurt|Tharin|or|S8
Ord Ortag||hs|S13
Ord Pardron|Dufilvian|mr|R15
Ord Pentala||ir|K14
Ord Radama|Esstran|or|Q5
Ord Sabaok||co|J13
Ord Sedra|Clacis|or|K4
Ord Segra|Dufilvian|mr|Q15
Ord Sigatt|Noonian|or|N6
Ord Simres|Brema|or|M17
Ord Tellarom|Suolriep|or|S8
Ord Tessebok|Irishi|mr|K6
Ord Thabl|Elochar|mr|R9
Ord Thoden Dynali||or|J4
Ord Tiddell|Tennuutta|mr|Q7
Ord Torrenze|Sertar|or|S5
Ord Traga|Tragan Cluster|or|N5
Ord Trasi|Relgim|or|L4
Ord Varee|Belshar|mr|J7
Ord Vaug|Rocantor|ex|L15
Ord Vaxal Callia||ir|N13
Ord Wylan|Oktos|mr|R12
Ord Yndar|Esaga|mr|Q11
Ord Zat|Jospro|or|S7
Ord Zeuol|Vilonis|mr|O16
Ord Zynthar|Lambda|mr|P16
Ordnandell|Kastolar|mr|R10
Ordo|Mandalore|or|O7
Ordo Eris|Chorlian|or|S4
Ordo Moon|Bortele|mr|R8
Ordo Tera|Belasco|ex|P11
Oreenda Fayeet||cl|L13
Orelon|Hapes Cluster|ir|O9
Orgri, The|Jubilar|or|T7
Oricho|Oricho|or|M6
Oricon|Corva|or|P3
Oridol Cluster|Rolion|or|P7
Orimanther|Quelii|or|O6
Orinackra||ws|J3
Orinca|Tunka|or|I19
Orinda|Irishi|mr|K6
Oriolanis|Oriolan|mr|J16
Orion|Tion Hegemony|or|T6
Orish|Brema|or|M17
Oristrom||ur|I5
Orixon Nebula|Phelleem|or|S7
Orkellia|Haserian|mr|Q15
Orko|Videnda|or|L18
Orleon|Talcene|mr|Q8
Orma|Brak|ex|O14
Orn Kios|Javin (Yarith)|or|K18
Ornfra|Chiss Space|ur|F8
Oro Sankeria|Tharin|or|S7
Orocco|Ottega|mr|M7
Orondia||hs|S11
Orooturoo|Farlax|co|K10
Orowat|Myto|or|K4
Orra|D'Astan|or|O5
Orranana|Cadma|or|T8
Orrik|Dalicron|or|K19
Orroman||ws|I14
Orron|Corporate Sector|or|S4
Orryxia|Seswenna|or|M18
Orsis|Haserian|mr|Q15
Orthellin Binarran|Cloud|cl|M9
Orto|Sluis|or|M19
Orto Norwe|Trans-Vulta|mr|N7
Oru|Veragi|or|L3
Orvax|Savareen|or|R17
Osadia||co|K10
Osara||ir|K8
Oseon|Centrality|or|T8
Oshetti|Aparo|or|R3
Oshira|Vilonis|mr|O16
Oshora|Tolonda|or|Q17
Osirrag|Elrood|or|M20
Osisis Station Regani||ir|M8
Osk-Trill||co|M10
Oslumpex|Corporate Sector|or|S4
Osmani|Senex|mr|L18
Ossel|Bozhnee|or|L18
Osseriton||ur|G9
Ossi|Mezeg|mr|N7
Ossiathora|Juvex|mr|L17
Ossiathora||ir|J8
Osskorn Tyan||mr|L6
Osssorck Nebulae||co|J12
Ossus|Auril|or|R6
Ostega|Grohl|or|R15
Ostor|Koradin|or|I18
Ota|Mytaranor|mr|Q10
Otavon|Hollan|mr|M7
Oteroa|Corthenia|mr|K7
Otomok|Prefsbelt|or|K6
Otor's Hub|Ojoster|or|N7
Otranto|Nembus|or|P4
Ottabesk||dc|M11
Ottethan|Halthor|or|M6
Ottinger|Perinn|or|J4
Otunia|Bosph|or|Q3
Oulanne||ir|L14
Outer Mebarius||ir|N10
Outland Station|Baxel|or|T12
Ova|Quelii|or|O6
Ovanis|Pacanth Reach|or|G16
Ovise|Zuma (Moddell)|or|H16
Ovissi|Manda|mr|R14
Oyokal|Chiss Space|ur|E8
Oznek|Cademimu|or|M6
Ozri|Far Xandil|mr|P16
Ozu|Javin (Anoat)|or|K18
P'frorin|Bheriz|or|U10
Pa Tho||ir|K14
Pa'hir'al|Urce Space|mr|L7
Paarin Minor|Cademimu|or|M6
Pabu|Chopani|or|L3
Pacara||mr|J15
Padua||co|M12
Paecia|Quelii|or|O6
Pagodon|Pelgrin|or|R18
Paig|Drannik|ex|K8
Paigu|Vorzyd|or|R6
Paklan|Nuiri|or|Q6
Paklarn Abaar||mr|K7
Pako Ramoon|Rayter|or|J19
Pakrik|Kanchen|co|K9
Pakuuni|Pakuuni|or|T6
Pal Goral|Mortex|or|R4
Palagosal|Arkanis|or|R17
Palanhi|Fakir|cl|K9
Palawa||co|L10
Palek|Cyrillian Protectorate|ex|O12
Pallaxides|Ojoster|or|N7
Palliduva||ws|U12
Palmatian Baronos||cl|M9
Pam'ba||mr|H15
Pamaradia||cl|L8
Pamarthe|Mayagil|or|N18
Pamina|Prime|ir|M8
Pammant|Calamari|or|U6
Pamorjal|Immerian Outback|ex|N14
Panatha|Pacanth Reach|or|H16
Pandem Nai|Thrasybule|or|P6
Pandori|Sarin|or|O18
Panela||co|M12
Pangarees, The|Airam|or|L20
Panisia|Halthor|or|L6
Panna|Cronese Mandate|or|S6
Pansha||co|K12
Pantolomin|Dolomar|co|K9
Pantora|Sujimis|or|P19
Pantrosian Eye|Endocray|mr|R14
Paonid||ir|O8
Paqualis||ir|L8
Paqwepor Major|Paqwepori|mr|P15
Parabaw Station|Jospro|or|S7
Parada|Hadar|mr|L17
Paradise|Airam|or|M20
Paradise Station|Gendius|mr|J17
Paramatan|Senex|mr|L17
Parau|Great Agash|ex|K15
Parcelus Major Parcelus||ex|O12
Parcelus Minor Parcelus||ex|O12
Parcovey Minor|Hune|mr|Q12
Parein|Sarin|or|O18
Pargaux||co|K12
Parkella|Elbaran|mr|J17
Parkis||cl|M10
Parlatal|Javin (Yarith)|or|K18
Parliock|Ariarch|mr|J6
Parmel|Parmel|or|O18
Parmic|Parmic|or|P19
Parnassos||ur|H6
Parozha|Dustig|mr|M16
Parshoone|Perinn|or|J4
Parthovian|Cluster|ws|T4
Partold|Instrop|or|T17
Parwa|Seswenna|or|M18
Pas'sic|Oricho|or|M5
Pasa Novo|Onatos|mr|R15
Pasaana|Ombakond|ex|O13
Pasher||ir|M14
Pashvi||ws|I5
Pasmin|Cronese Mandate|or|S6
Pastil|Abrion|or|S15
Pastoria|Juris|or|P17
Patch|Cademimu|or|M6
Pathandr||ir|O8
Patitite Pattuna|Bright Jewel|mr|L7
Patriim|Seswenna|or|M18
Patrolia||ir|L14
Paucris Major|Tamarin|or|N18
Paulking|Centrality|or|U8
Pavia|Tapani|cl|L13
Pavo|Prime|ir|N10
Pax|Kira|ex|N16
PDC3141-02|Trax|mr|P10
Pedd|D'Astan|or|O6
Pedducis|Chorios Meridian|or|R7
Pedorian|Bryx|mr|R8
Peg Shar|Halla|mr|R8
Pegg|Tynquay|or|R4
Peirs|Kathol|or|M21
Pelagon|Tapani|cl|L13
Peldon Minor|Cassander|or|L5
Pelemax||cl|M9
Pelgrin|Pelgrin|or|R17
Pelkonen|Koradin|or|J18
Pella|Tapani|cl|L13
Pellastrallas|Agarix|mr|K18
Peluchia|Kurost|mr|Q11
Pembric|Kathol|or|M21
Pencael||cl|M12
Pendal|Homon|mr|M7
Pendari|Vensensor|ex|K16
Pendarr|Alchenaut|ex|L15
Pendaxa|Jjannex|or|K19
Penegelen||ir|L14
Penga||ir|N10
Pengalan||ir|O8
Penhalla|Klina|or|S13
Peppel|Corva|or|P3
Per Lupelo||ir|L8
Peragus|Xappyh|or|Q4
Pergitor|Minos Cluster|or|M20
Peridon's Folly|Esaga|mr|Q11
Perilious|Pelgrin|or|R17
Perilix||cl|L9
Perimako Major|Ash Worlds|or|S7
Perin|Trianii Space|ws|R3
Perithal||ir|N14
Perlandia|Stensen|or|I17
Perlemia||co|L9
Perma||co|M11
Permondiri||co|J13
Pernam Minor|Minos Cluster|or|M20
Pernella|Tapani|cl|L13
Persavi|Taldot|mr|Q9
Persaya||ir|K8
Persis|Bes Ber Bikade|ex|L15
Perthrillia||cl|J13
Pervi||cl|L13
Pervick|Corva|or|P3
Pesfavri||ur|G8
Peshara||co|L10
Pesitiin||ex|I8
Pesmenben|Teraab|mr|Q11
Pestoriv||cl|N12
Petabys Station|Halm|mr|J16
Petrakis||ir|O11
Petrusia|Nuon e Safyd|ex|P12
Phaeda|Cademimu|or|L6
Phaegon|Grumani|or|N17
Phandas||dc|M11
Phaseera|Lantillian|mr|P8
Phateem|Nouane|ir|N8
Phatrong|Thrasybule|or|P6
Phattro|Abrion|or|S15
Phelarion|Seswenna|or|M18
Phelope|Hapes Cluster|ir|O9
Phelzepham|Esuain|mr|P7
Phemis|Corellian|co|M11
Pheryon||ir|J8
Phibia|Haserian|mr|Q15
Philaxia|Har Worlds|ex|J16
Phindar|Demetras|or|P6
Phinel's Folly|Auril|or|R7
Pho Ph'eah|Kalamith|or|P5
Phoebus|Thanium|or|R6
Phorliss|Dolomar|co|K9
Phorose||cl|M13
Phorsa Gedd|Dohlbani|mr|R13
Phosphura Belt Nebula|Atravis|or|L20
Phothrell||ir|M8
Phr'sha|Fei Hu|mr|P13
Phracas||co|J10
Phraetiss|Farrfin|co|K9
Phrill|Astal|or|P17
Phu||cl|J13
Picadir|Mayagil|or|N18
Pickerin|Bright Jewel|mr|L7
Picutorion|Kwymar|or|Q4
Pieldi|Juvex|mr|L18
Pii|Arkanis|or|R16
Pijal||ir|L8
Pil Diller|Quelii|or|O6
Piluvia|Torch Nebula|or|P19
Pinara|Sujimis|or|P19
Pindra||ir|N9
Pinett|Elrood|or|M20
Pinoora|Gordian Reach|or|P6
Pinperu|Calamari|or|U6
Pinurquia|Rolion|or|Q7
Pioku Trans-Jardeen||ex|K15
Pion||ws|H14
Pipada|Videnda|or|M18
Pippip|Illisurevimurasi|or|Q4
Pipyyr|Bakura|or|G16
Pirik|Tharin (Divis Arm)|or|S8
Pirin|Locris|ex|O8
Piroket|Arkanis|or|R16
Pirol|Farlax|co|K10
Pirralor|Juvex|mr|L18
Pirsen|Eidoloni|mr|L16
Pitann|Kathol|or|M21
Piton||co|K12
Pitrillistia|Mieru'kar|or|O3
Pits of Plooma|Veragi|or|L3
Piu|Kallea|or|K21
Pizilis|Terr'skiar|mr|P10
Pizkoss||co|K10
Pkihantri||co|L12
Pkori||ws|J5
Plavin||cl|L9
Plavonia|Kriz|or|J18
Plazir||or|N2
Pleem's Nexus|Mezeg|mr|N7
Pleida|Oricho|or|M6
Pleknok||ur|G9
Plesstil|Veragi|or|L3
Plexis||co|L13
Plin|Minor|ir|K14
Ploo|Ploo|ex|N7
Plood|Pacanth Reach|or|G16
Plooriod|Ploo|ex|N7
Pluthan||ws|U8
Plympto|Corellian|co|M11
Po'yin|Phelleem|or|S7
Poderis|Orus|ir|M8
Polaar|Eidoloni|mr|L16
Polanis|Corellian|co|M11
Polis Massa|Subterrel|or|K20
Pollillus Vannell||co|J10
Polmanar|Javin (Anoat)|or|K18
Poln|Candoras|or|J5
Polneye|Farlax|co|K10
Polomie|Oriolan|mr|J16
Polordio|Danjar|or|M19
Polroth|Bryx|mr|R8
Polus|Oricho|or|M6
Polyneus||ir|J14
Pondakree||cl|N12
Pondut Station|Corporate Sector|or|S4
Ponemah|Zuma (Spar)|or|H16
Ponolapo|Atravis|or|L19
Ponton|Tharin|or|S8
Pontus|Tolonda|or|Q18
Porchello|Elbaran|mr|J17
Poressi|Dantus|or|K6
Pormthulis|Kira|ex|N16
Porpor|Grohl|or|S16
Port Bianco||cl|L13
Port Evokk|Senex|mr|L18
Port Ferrule|Suolriep (Iotran Expanse)|or|S8
Port Jerrell|Koradin|or|J18
Port Lasgo|Bheriz|or|U10
Port Lennax|Ojoster|or|N7
Port Mackie|Deadalis|ex|J7
Port Nowhere||ws|H19
Port Yonder|Pelgrin|or|R18
Portminia|Sprizen|or|N5
Portocari|Belsmuth|or|O6
Porus Vida||ir|O9
Poseidenna|Calamari|or|U7
Pothor|Roche|mr|Q8
Pouffra|Rolion|or|Q7
Povanaria|Gordian Reach|or|P6
Poviduze||ex|J14
Poytta||hs|T12
Pozzi|Tapani|cl|L13
Praadost|Nembus|or|P4
Praesitlyn|Sluis|or|M19
Prahvin||ir|M14
Praidaw||ir|K14
Prakith||dc|K10
Prakith|Minor|cl|L9
Praktin|Thusa|mr|O7
Pral||ws|L21
Prandril|Minos Cluster|or|M20
Praven Prime|Quelii|or|O6
Praxat Sil|Jidlor Marches|mr|J16
Praxlis Praxlis||co|J10
Praya|Clacis|or|K4
Prazhi|Cyrillian Protectorate|ex|O12
Prefsbelt|Prefsbelt|or|K5
Prekaz||co|K9
Presbalin|Gordian Reach|or|P6
Pressylla|Oricho|or|M6
Presteen|Senex|mr|L17
Prexiar|Steniplis|or|L19
Pria||co|M10
Prildaz|Farlax|co|K10
Primarin||ir|M13
Primea Vak Combine*||ur|F7
Primtara|Primtara|mr|P15
Primus Cabru|Allied Tion|or|S6
Prine|Vilonis|mr|O16
Priole Danna|Sprizen|or|O5
Prishardia|Antemeridian|or|R7
Prishella|Kessel|or|T10
Procopia|Tapani|cl|L13
Prolifera|Corosi|or|N6
Promencius|Thanium|or|S5
Prospera Jang|Kurost|mr|Q11
Protazk|Kwymar|or|Q4
Protobranch||co|J13
Protogeyser||ir|K8
Proxima Dibal||ws|Q3
Pugal|Glythe|mr|J7
Pulassas Minor|Koradin|or|J18
Puloorn|Spinward|or|M3
Purala|Kibilini|or|Q17
Purcassia||cl|L13
Purnham|Shelsha|cl|M9
Pursin|Atravis|or|L19
Pusat Station|Halla|mr|R8
Pybus||hs|S11
Pygorix|Gordian Reach|or|Q6
Pyjridj|Agarix|mr|K17
Pyolli|Seswenna|or|M18
Pypin|Trianii Space|ws|R3
Pyra|Fei Hu|mr|P13
Pyrlix Miasma|Tyus|mr|N16
Pyros||cl|K13
Pyrr||ws|U6
Pzandias|Bryx|mr|S7
Pzob|Herios|or|T15
Q'Maere|Kathol|or|M21
Q'mara|Juvex|mr|L18
Q'nithian|Nembus|or|P4
Qalita|Prime|ir|J13
Qalydon|Sertar|or|R5
Qaras|Minyavi|mr|I16
Qat Chrystac Parnabe||ex|L16
Qeimet|Juris|or|P17
Qemia|Strabin|mr|M7
Qexis|Danjar|or|N19
Qhulosk|Tharin|or|T8
Qi Lozar|Grumani|or|M17
Qiaxx|Cor'ric|or|P18
Qiilura Qiilura||mr|L7
Qina|Zuma (Moddell)|or|H16
Qixoni|Nebula|cl|K13
Qlothos||ir|M14
Qonto||ws|J3
Qoribu||ur|H7
Qotile|Colundra|or|S5
Qretu||ir|L15
Qu'mock|Kathol|or|M21
Quadrant Seven|Barsa|mr|J6
Quaensan Prime|Gendius|mr|J17
Quaggia||hs|S9
Qualai|Kallea|or|K20
Qualtrough|Belsmuth|or|O6
Quamar|Bruanii|mr|K17
Quan-Shui|Montitian Grant|ex|J15
Quanducial|Gordian Reach|or|Q6
Quanton|Obtrexta|or|K4
Quarmendy|Yucrales|mr|R15
Quarzite||ir|M13
Quas Killam|Terr'skiar|mr|P10
Queel|Doldur|mr|P15
Quelii|Quelii|or|O6
Quell|Nuiri|or|Q6
Quellor|Quellor|cl|N12
Quellus||ws|G14
Queluhan|Nebula|ws|H12
Quence|Quence|or|O18
Quenk|Corusca|co|L9
Quermia|Nilgaard|or|S5
Ques||hs|S8
Quesaya|Andirma|ex|L15
Quesh||hs|S10
Quesna|Toblain|or|O18
Questal Questal||co|J12
Quethold||ur|I5
Queyta|Danjar|or|M19
Quian||co|L9
Quiberon|Quiberon|or|T15
Quila|Rolion|or|P7
Quilan|Roche|mr|Q8
Quilken|Abrion|or|R15
Quint||ir|M8
Quintar Nebula|Surron|ex|O13
Quintarad,|The|ws|H18
Quintil|Svivreni|or|N19
Quintus|Albarrio|or|K5
Quockra|Minos Cluster|or|M20
Quooria|Farstey|ex|O8
Quyste|Thesme|or|O6
R-Duba|Quiberon|or|T15
R'alla|Corporate Sector|or|S3
R'terleD'er|Kriz|or|J18
Raada|D'Astan|or|O5
Raamen Tacuni||ex|N15
Rachuk|Rachuk|cl|N11
Radama Void|Esstran|or|Q5
Raddan|Tharin|or|S8
Radhii||ws|I18
Radnor|Daimar|mr|Q16
Raed||cl|N11
Rafa|Centrality|or|T8
Rafft||ir|J8
Ragith|Majoor|ex|N15
Ragmar|Karthakk|or|Q17
Ragna|Daimar|mr|Q16
Ragnar|Merel|or|Q18
Ragnook|Bothan|mr|R14
Rago||ws|I7
Ragoon||co|K9
Raider's Point|Corellian|co|M11
Rainboh|Hapes Cluster|ir|O9
Rainbow Nebulae|Hunnoverrs|or|R16
Rainos Cluster|Rocantor|ex|L15
Raithal||cl|M9
Rajtiri|Dona Laza|ex|P9
Rakaa||co|J12
Rakata|Prime|ur|G11
Rakhuuun|Mytaranor|mr|Q10
Rakrir|Kwymar|or|Q4
Ralchon|Gaulus|or|S17
Ralgos|Esstran|or|Q5
Ralltiir|Darpa|co|L9
Ralme|Brak|ex|O14
Raltac||ir|K8
Ramoa|Sprizen|or|N5
Ramodi|Tregillis|ex|M15
Ramook||ws|O3
Ramordia|Majoor|ex|N15
Ramorea||ir|O7
Rampa|Corporate Sector|or|S4
Rampa Minor|Baxel|or|U12
Ramsir|Jospro|or|S7
Randa|Kessel|or|T10
Randon|Mytaranor|mr|Q10
Randorn|Belderone|or|Q6
Rango Tan|Relgim|or|L5
Rangorah|Calaron|or|T9
Ranklinge|Shelsha|cl|M9
Rannon|Instrop|or|T17
Ranroon|Mortex|or|R5
Rantine Space Station|Tamarin|or|N19
Rantofar||co|M11
Rapacc Paccian Governance*||ur|E7
Raquish|Lambda|mr|Q15
Rarlech||ur|H5
Rashfond||ir|L14
Raskane|Sepan|ex|P13
Raspar|Tragan Cluster|or|N5
Rasterous||ir|O10
Rata Nebula|Chiss Space|ur|E9
Ratamesh|Farstey|ex|O8
Rathalay|Taldot|mr|R9
Ratit||ir|M14
Rattatak|Trilon|or|H16
Ravaath|Pacanth Reach|or|H16
Ravager's Rift|Iska|mr|J17
Raxus Prime|Tion Hegemony|or|S5
Raxxa||co|M10
Raydonia|Belsmuth|or|O6
Raysol Prime|Duluur|cl|M13
Razia||cl|M13
Rbollea|Hapes Cluster|ir|O9
Reamma|Corbett|mr|I17
Reaper's World|Nilgaard|or|S5
Rearqu Cluster|Taldot|mr|P8
Reboam|Hapes Cluster|ir|O9
Recluse's Nebula|Irishi|mr|K6
Recopia||co|M11
Red Hand Cluster|Trax|mr|Q10
Red|Nebula|ws|G21
Red Twins,|The|ws|I7
Red Yars|Croynar|ir|M14
Redcap|Savareen|or|Q17
Redhurne|Metatessu|mr|R9
Redoubt,|The|ur|H7
Redrish|Kuat|co|M10
Redspace Reefs|Oktos|mr|R12
Reecee||ir|J8
Reega|Demetras|or|P7
Reegian|Sumitra|ex|O7
Reena|Tapani|cl|L13
Reena Minor|Bothan|mr|R14
Reesaria|Bheriz|or|U10
Refgar|Demophon|co|M10
Refnar|Pakuuni|or|T6
Refnu|Sprizen|or|N5
Refrax|Mortex|or|R5
Regalia|Meram|or|O4
Regalia Station|Cadavine|or|P17
Regel||ws|I7
Regellia|Minos Cluster|or|M20
Reginard|Pakuuni|or|T6
Regis Kor|Gendius|mr|J17
Regolith||cl|N12
Regor-Mada|Tantra|or|M19
Regulan|Albanin|or|U12
Regulgo|Ryndellian|mr|P17
Rehemsa||co|M11
Rehn|Brak|ex|O14
Reibrin|Suolriep (Ansuroer)|or|S8
Reigalius|Yucrales|mr|Q15
Rekardia|Vensensor|ex|K16
Rekelos|Arc d'Stot|ex|K15
Rekkana||co|L9
Rekkiad|Chorlian|or|S4
Relarr||co|M10
Relatta||ir|N8
Relephon|Hapes Cluster|ir|O9
Relik|Steniplis|or|L19
Relkass|Saijo|or|K20
Rellio|Tapani|cl|L13
Rellnas|Har Worlds|ex|J16
Reltooine|Corporate Sector|or|R3
Remitik|Wazta|or|J18
Remmon Nebula|Iskin|mr|O16
Rena||cl|K13
Renatasia|Centrality|or|U8
Rend|Surron|ex|O13
Rendili||co|M11
Renegg|Kuat|co|M10
Renforra|Dalicron|or|K20
Renillis||ir|L14
Rennokk|Kessel|or|U10
Rentalles|D'Astan|or|O4
Rentaxius||ir|O8
Rentean|Jjannex|or|K19
Rentor|Chiss Space|ur|F8
Reo|Maraqoo|mr|I7
Reopi||co|M10
Repea|Auril|or|R7
Resh 9376|Nuiri|or|Q6
Resht||cl|N10
Resilon|Bortele|mr|S8
Resti Kel|Juvex|mr|L18
Retep|Daimar|mr|Q16
Rethel Point|Far Xandil|mr|P16
Retta||ws|U8
Rettna|Esaga|mr|Q11
Reuss|Portmoak|or|P18
Reventine|Seswenna|or|M18
Revery|Noonian|or|N6
Revkinn|Parmel|or|O18
Revyia|Veragi|or|L2
Rex Strata|Wazta|or|J18
Reyna|Tapani|cl|L13
Reyniu|Mayagil|or|N18
Reynon|Albarrio|or|K5
Reytha|Harron|ex|O12
Rezi|Bajic|or|P17
Rhamalai|Varada|or|I19
Rhamsis Callo|Danjar|or|N19
Rhanipur|Hevvrol|mr|O15
Rhelg|Esstran (Sith Worlds)|or|R5
Rhen Var|Thanium|or|R6
Rhigar|Chiss Space|ur|E9
Rhilithan|Indrexu|or|S5
Rhinnal|Darpa|co|L9
Rhommamool|Merthian|ex|N13
Rhuvia|Relgim|or|L5
Rial Kroon|Noonian|or|M6
Rianon|Tapani|cl|L13
Ribento|Quence|or|O19
Ricaldi|Tapani|cl|L13
Riddellia|Albanin|or|T12
Ridlay|Lambda|mr|P16
Ridley||ir|L8
Riesa|Tapani|cl|L13
Riflor|Narrant|mr|J16
Rigel|Bheriz|or|U11
Rigoron|Dimean|ex|P13
Rigovia||ir|N8
Riileb||hs|T12
Rijel Dalqan||ex|M7
Rikadi||ir|J13
Rikmania|Steniplis|or|L19
Rilias|Mayagil|or|M18
Rim|Kibilini|or|Q17
Rimbaux|Halthor|or|M6
Rimcee Station|Braxant|or|J3
Rimma||co|L13
Rina Major|Stensen|or|I17
Rinagom|Corporate Sector|or|S3
Rindao|Hadar|mr|L17
Rindia|Nembus|or|P4
Rindoon|Rseik|or|N19
Rine-cathe||co|L9
Ring of Kafrene|Thand|ex|J15
Ring, The|Javin (Anoat)|or|K18
Ringali Nebula|Bormea|co|L9
Ringlite|Tamarin|or|N19
Ringneldia|Centrality|or|T8
Ringo Vinda|Eucer|mr|R7
Rinn|Baxel|or|U12
Rintonne|Lambda|mr|P16
Rion|Kessel|or|T10
Rior|Tamarin|or|N18
Riosa||ir|J8
Rirsack|Belsmuth|or|O6
Risban|Tion Hegemony|or|S5
Rishi|Abrion|or|S15
Risso||ir|N14
Rivoria|Tunka|or|J19
Rivvidu|D'Astan|or|O5
Ro Mira|Vensori|mr|P8
Ro-Loo Triangle|Lambda|mr|P16
Rocantor|Rocantor|ex|L15
Rocedila|Auril|or|R6
Rocrin|Airam|or|M20
Rocun Cluster|Yminis|or|S14
Rodaj||ir|L15
Rodia|Savareen|or|R16
Rodis|Zuma (Sugai)|or|H16
Rogue Antar|Steniplis|or|M18
Rohm|Hevvrol|mr|O15
Roil, The|Gordian Reach|or|Q5
Rokaria|Tynquay|or|Q4
Rokirex|Herios|or|T16
Rol|Noonian|or|M6
Roldalna|Kira|ex|N16
Romar|Galov|or|T13
Romik|Quelii|or|O6
Romin|Romintine|mr|Q8
Romossobar|Eucer|mr|R7
Ronaphaven|Garis|or|N17
Rondai||ir|J8
Ronyards||ir|N13
Roon|Abrion|or|S15
Roona|Bes Ber Bikade|ex|L15
Roost Bitrose||or|T17
Ropagi|Kira|ex|N16
Roqoo Depot||ir|O9
Rorak||hs|S12
Rordak|Pelgrin|or|R17
Rorgam|Terr'skiar|mr|Q10
Rotas|Yminis|or|S14
Rothana|Quiberon|or|T15
Rotoga|Alchenaut|ex|L16
Roundtree||ir|M14
Routh|Velcar|or|J5
Rowacki||ir|O10
Roxuli|Roxuli|ex|I8
Rrulinn|Yushan|mr|K17
Rseik|Rseik|or|N20
RTK111|Yminis|or|S14
Ruac|Lothal|or|U7
Ruan||co|K10
Ruathi|Jjannex|or|K19
Rubinero||co|L12
Rubogea||co|L9
Rudrig|Tion Hegemony|or|S6
Rudun|Kontahr|mr|R11
Rugosa|Sanbra|or|O17
Ruhe|Savareen|or|Q17
Ruhnuk||ws|G13
Ruisto|Calamari|or|U6
Rulaar|Senex|mr|L17
Rullag|Cadma|or|T8
Ruloosia|Oktos|mr|R12
Rumil|Mezeg|mr|N7
Runaway Prince||hs|R11
Ruoss|Minor|cl|M9
Rurgavea||co|L13
Rushan|Andirma|ex|L15
Rustibar|Churnis|mr|J7
Rutal||ws|J13
Rutan|Atravis|or|L20
Ruugia|Altier|ex|O13
Ruul||co|M10
Ruuria|Xappyh|or|Q3
Ruusan|Teraab|mr|P11
Ruweln|Bothan|mr|R14
Rya|Kwymar|or|P4
Ryarten|Corthenia|mr|K7
Ryborea Ryborean||ex|J8
Rycep|Jjannex|or|L19
Rychel|Dalonbian|or|L2
Rydar|Antemeridian|or|R7
Rydonni|Prime|co|M11
Ryloon|Velcar|or|J5
Rylorii Minor|Rocantor|ex|L15
Ryloth|Gaulus (Ryloth)|or|R17
Rynmar|Hapes Cluster|ir|O9
Ryoone|Wazta|or|I17
Rystan||ws|M20
Ryvellia Treffani||ex|O14
Ryvester|Meridian|or|R7
Ryyk Nebula|Trans-Vulta|mr|N7
RZ7-6113-23|Chopani|or|L4
Saarn|Esstran|or|P5
Sab Rufo||ir|N8
Sabanash|Tyus|mr|N16
Sabata|Halla|mr|R9
Saberhing|Corellian|co|M11
Sabrash|Metatessu|mr|R9
Sabrixin|Samix|or|Q19
Saclas|Corporate Sector|or|S4
Sacorria|Corellian|co|M11
Saffa|Halla|mr|R8
Saffalore|Corporate Sector|or|S4
Safrifa|Videnda|or|M18
Sag Kemper|Tamarin|or|N18
Sagar Wentrion||ir|N13
Sagma|Illisurevimurasi|or|Q4
Sahbrontee||mr|I15
Saheelindeel|Tion Hegemony|or|S6
Saijo|Saijo|or|K20
Saila Na|Javin (Anoat)|or|K18
Sakavi Tar||or|I19
Saki||hs|S11
Sakidopa||hs|S11
Sakiduba||hs|S11
Sakifwanna||hs|T11
Sakreen|Ash Worlds|or|S7
Sakuub|Pelgrin|or|R18
Salagor||ir|N13
Salaktori Anchorage||ir|O10
Salaniss||ws|H17
Saleucami|Suolriep|or|S8
Salgarus||cl|L9
Salient|Aparo|or|R3
Salin|Sprizen|or|N5
Salissia||or|T5
Salliche||co|K10
Salmagodro||ir|M8
Salobea|Noonian|or|M6
Salstan|Marzoon|mr|I16
Saltear|Tarabba|or|M19
Salteract|Rayter|or|J19
Salvara|Tennuutta|mr|Q7
Samaria||co|M11
Samarine|D'Astan (Samarine)|or|O5
Samhar|Grumani|or|N17
Sammun Ash|Worlds (Batonn)|or|T7
Samovar|Koradin|or|I18
Sanbra|Sanbra|or|O17
Sandonia||ir|N14
Sanej||ir|N13
Sanjin||cl|M13
Sanrafsix|Grumani|or|N17
Santarine|Hook Nebula|or|O18
Santheria|Esuain|mr|Q7
Sanyassa|Zuma (Moddell)|or|H16
Sanza|Sloo|mr|P14
Sapella|Kathol|or|M21
Sappire|Dalicron|or|K20
Saqqar||hs|T11
Saracor|Oriolan|mr|J16
Saraf Cobar|Montitian Grant|ex|J15
Sarapin||co|M10
Sarconia||cl|M10
Sardoran||co|M11
Sareet|Stensen|or|I17
Sargesso|Tharin|or|S8
Sargon|Hapes Cluster|ir|O9
Sarina|Mektrun|mr|L17
Sarjenn|Tragan Cluster|or|N5
Sarka|Sarka|mr|Q8
Sarkania||ir|M14
Sarkhai|M'shinni|mr|M7
Sarko|Venzeiia|ex|O12
Sarlucif||ws|S4
Sarm||ws|I8
Sarnikken|Fakir|cl|K9
Sarnus||ws|O3
Sarpazia|Illodia|co|K13
Sarq||mr|I15
Sarrahban|Cyrillian Protectorate|ex|O12
Sarranket|Brevost|ex|O15
Sarrassia|Grumani|or|N17
Sarrelon|Brevost|ex|O15
Sarrish|Vensensor|ex|K16
Sartoy|Mieru'kar|or|N3
Sarumo|Merel|or|Q19
Saruwen Station|Tamarin|or|N18
Sarvchi|Chiss Space|ur|F9
Sason|Cassander (Tadrin)|or|K5
Sathiemon|Illisurevimurasi|or|Q4
Sauwecer|Videnda|or|L18
Savareen|Savareen|or|Q16
Savek|Esstran (Sith Worlds)|or|R4
Sawaya|Thesme|or|O6
Sayblohn|Quess|mr|N16
Scarif|Abrion|or|S15
Scarl|Tapani|cl|L13
Schesa|Chiss Space|ur|F8
Scillal|Centrality|or|T8
Scipio|Albarrio|or|K5
Seatos|Sluis|or|M19
Sebaddon||mr|Q11
Sebiris|Kathol|or|M21
Sechar|Tharin (Divis Arm)|or|S8
Secundus Ando|Lambda|mr|Q15
Sedapard|Cluster|mr|O16
Sedesia|Druess|mr|O16
Sedratis||co|M11
Sedri|Tharin (Periphery)|or|S8
Seelos|Kwymar|or|Q4
Seeratter||ws|G14
Seezar's Planet|Jjannex|or|L19
Sefon|Tapani|cl|L13
Seftek|Vorzyd|or|R6
Segra Milo|Jospro|or|R7
Seidhkona||ws|T5
Seikosha|Nembus|or|P4
Seitia Prime|Seitia|or|K19
Selab|Hapes Cluster|ir|O9
Selaggis|Quelii|or|N6
Selavia|Suolriep|or|S10
Selenius|D'Aelgoth|mr|L17
Seline|Dalonbian|or|M3
Selitan|Gordian Reach|or|P6
Sellasas|Jjannex|or|L18
Selnesh|Irishi|mr|K6
Selsor|Zarracina|ex|O14
Seltaya Major|Mieru'kar|or|O3
Seltos|Mulgard|mr|N16
Seluket||ir|I9
Selvaris||ws|I9
Selvernis|Svivreni|or|O19
Semag|Semagi|mr|I16
Sembla|Sertar (Mahrusha)|or|S5
Senex|Senex|mr|L17
Sennatt|Bothan|mr|R14
Sennex|Hapes Cluster|ir|O9
Sennoa|Ojoster|or|N7
Senthrodys||ir|O10
Sentuvia||ir|N8
Seoul||ws|H20
Sepan|Sepan|ex|P13
Septevorres|Antemeridian|or|R7
Septra|Kathol|or|M20
Seraphan||cl|N10
Serat|Senex|mr|L18
Sereeda|Ash Worlds|or|T7
Seregar|Calaron|or|U9
Serelia|Oriolan|mr|J16
Serenity|Tashtor|mr|J16
Serenno|D'Astan|or|P5
Sergia Kalakan||ir|J15
Serianan||ws|P2
Sermeria|Locris|ex|O8
Sern Prime|Sern|cl|L13
Sernpidal|Dalonbian|or|L3
Serolonis|Kriz|or|J18
Serpine|Illisurevimurasi|or|Q4
Serria|Rocantor|ex|L15
Serroco|Ploo|ex|N7
Serule||co|K9
Sesid|Corva|or|P4
Sespe|Tharin (Periphery)|or|S9
Sestina||co|M11
Sestooine|Relgim|or|L5
Sestria Testarr||co|M13
Seswenna|Seswenna|or|M18
Setar Inner|Cluster|ir|O11
Setolio|Tapani|cl|L13
Setor||cl|L8
Setron|Noori|ex|O11
Sev Tok|Kurost|mr|Q11
Sevarcos|Tamarin|or|N19
Sevari|Chorlian|or|S4
Sevetta|Sevetta|or|T16
Sewalia||ir|L14
Seylott|Sarin|or|P18
Seymarti||cl|M13
Seyugi||co|M11
Sh'ung-tesk|Ciutric|or|N4
Sha'rellia||hs|S12
Shackel|Chaykin|ex|O14
Shadda Nebula|Toblain|or|O18
Shador|Maerdocian|mr|Q13
Shadren|Belsmuth|or|O6
Shafr|Toblain|or|O17
Shahkir||ir|M14
Shalam||ir|M7
Shalankie||ir|O9
Shallow March|Mortex|or|S5
Shalm|Zuma (Ikenomin)|or|H16
Shaltin|Thanium|or|S6
Shalyvane|Indrexu|or|S5
Shantipole|Roche|mr|Q8
Shar'Ack|Atrivis|or|L5
Sharb|Chiss Space|ur|F8
Shard|Wazta|or|J18
Sharlissia|Bon'nyuw-Luq|or|N18
Shasa||ir|N12
Shasfath||ir|J14
Shatuun|Kathol|or|M21
Shaum Hii|Tragan Cluster|or|N5
Shawken||co|L9
Shawti||hs|S9
Shaylin|Pakuuni|or|T6
Shaymore|Immerian Outback|ex|N14
Shedu Maad|Hapes Cluster|ir|O9
Sheela|Abrion|or|S15
Sheh Soahi|Cassander|or|K5
Shelkonwa|Shelsha|cl|M9
Shella|Tapani|cl|L13
Shenio|Kalamith|or|P5
Sheris|Belsmuth|or|O6
Shesharile|Minos Cluster|or|M20
Sheva|Tapani|cl|L13
Shi'kar Straits|Nembus|or|P4
Shibric||ir|N14
Shifa|Tapani|cl|L13
Shiffrin|Tammuz|or|T15
Shihon|Chiss Space|ur|E8
Shikitari||ur|G14
Shili|Ehosiq|ex|L8
Shimia|Dalchon|or|R17
Shimmer|Rayter|or|J19
Shinbone||ws|T17
Shindra|Tapani|cl|L13
Shintel|Kathol|or|M21
Shiva||ws|L21
Shogun|Quence|or|O18
Shola|Tammuz|or|U14
Shoon|Senex|mr|L18
Shopani|Tapani|cl|L13
Shoroni||cl|M9
Shosho|Graador|mr|I17
Shotem||cl|J13
Shownar|Parmic|or|P19
Shramar|Clacis|or|K4
Shrokaan|Baroli|ex|N14
Shu-Torun|Chaama|mr|J7
Shuldene|Javin (Yarith)|or|J18
Shulstine||cl|M9
Shulxi||co|L12
Shumari|Parmel|or|O18
Shumavar|Atravis|or|L19
Shumogi||co|M12
Shuraden|Koradin|or|I18
Shurrupak|Vulcusion|ex|L16
Shusugaunt|Raioballo|or|L4
Shuxl|Javin (Yarith)|or|K18
Sibensko|Bes Ber Bikade|ex|L15
Sibetta|Gomar|ir|K14
Sibilaar|Bozhnee|or|L18
Sibisime|Sombure|mr|K17
Sídi|Illisurevimurasi|or|Q4
Sienar TF73|Tharin|or|S8
Sif-Alula|Trestis|ex|K8
Sif-Uwana||cl|K8
Sif'kric|Mezeg|mr|M7
Sifuchi|Lostar|ex|M7
Sigil|Chorlian|or|S4
Sigma Station|Demetras|or|P7
Sika|Brevost|ex|O15
Sikkem|Thanium|or|R6
Sikurd|Tynquay|or|Q4
Sil Gohtta|Lol|or|Q18
Sil'Lume|Seitia|or|K19
Sileria|Corellian|co|M11
Silken||ws|O20
Silla|Strabin|mr|M7
Silorna|Imberlin|ex|P13
Silunes|Arc d'Stot|ex|K15
Siluria|Atravis|or|L19
Silver Station|Doldur|mr|P15
Silversisi||ir|M8
Silvestri|Ado|mr|L17
Sim'char'ser|Albanin|or|U12
Simbarc|Cadma|or|T8
Simento-Threk|Meram|or|O4
Simik||ir|L14
Simocadia||ir|J13
Simoom|Senex|mr|L18
Simoth|Mortex|or|R5
Simpla|Kalamith|or|O5
Simra||cl|L13
Sinded|D'Aelgoth|mr|L17
Sinjan|Albarrio|or|K5
Sinkar|Fakir|cl|K9
Sinsang|Raioballo|or|L4
Sinta|Hune|mr|Q12
Sintheti|Noonian|or|N6
Sinton|Rago|mr|I7
Siola||co|K12
Sionia||hs|S10
Sipo|Kwymar|or|Q4
Sipsk|Kanz|or|N4
Sirdar|Oricho|or|M6
Siriamp|Halm|mr|J16
Sirpar|Arkanis|or|R17
Sisk|Calaron|or|U9
Siskeen|Hunnoverrs|or|R17
Sittana||co|L9
Sivad|Iskin|mr|O16
Siveria|Kibilini|or|Q17
Sivoria|Hapes Cluster|ir|O9
Sixela|Thuris|or|P18
Skako||co|L9
Skangravi|Msst|mr|P7
Skann|Astal|or|Q18
Skaradosh||ir|N13
Skaross|Morshdine|or|O4
Skarpos|Grumani|or|N17
Skärtis|Senex|mr|L17
Skeebo|Shadola|or|U8
Skeressa|Cadma|or|T8
Skine|Skine|or|Q19
Skone|Brak|ex|O14
Skor|Airam|or|M20
Skorrupon|Trans-Vulta|mr|N7
Skree|Chitarghar|ex|K15
Skuhl|Spadja|or|R5
Skustell Cluster|Tarabba|or|N19
Skuumaa|Mytaranor|mr|Q9
Skye|Varada|or|H19
Skynara|Skine|or|P19
Slandarvia M-9|Homon|mr|M7
Sleedara||co|L12
Sleheyron||hs|S10
Slession||ir|K14
Slivia|Astal|or|Q17
Sljee|Ehosiq|ex|M8
Sloogaria|Rseik|or|N19
Slotern|Wazta|or|J18
Sluis Van|Sluis|or|M19
Sluudren|Chorlian|or|S4
Smarab|Dohlbani|mr|R14
Smarck|Cademimu|or|K6
Smarteel||ws|U14
Smuggler's Run|Gaulus|or|S18
Sneeve|Kastolar|mr|Q10
Snevu||ur|H7
Snowdn|Centrality|or|U8
Snugano|Spirva|mr|L17
Sochi||ir|M9
Soco-Jarel|Xappyh|or|Q4
Socorro|Kibilini|or|Q17
Soika||ir|M8
Sojourn|Carrion|or|J4
Solacton|Tharin (Periphery)|or|S8
Solaest|Belsmuth|or|O6
Solanus|Lothal|or|U7
Solarine|Suolriep|or|S8
Solassus||co|M11
Solay|Lothal|or|U7
Solem|Rayter|or|J19
Solibus|Chitarghar|ex|K15
Solitair Garwian Unity*||ur|D8
Solloops|Kuat|co|M10
Solu|Meridian|or|R6
Solubria|Shadola|or|T8
Somavva|Tharin (Divis Arm)|or|S8
Someilk|Seswenna|or|M17
Somov Rit|Onatos|mr|R15
Son-tuul|Perinn|or|J4
Sondarr|Sertar|or|R5
Sonn Vilmari|Colundra|or|S5
Sontara||co|M12
Sontor|Tungra|or|K19
Soola|Khuiumin|or|O18
Sooma|Thanium|or|R6
Sooncanoo||ir|K8
Sorca Retreat||ir|O8
Sorderia|Suolriep|or|S9
Sorella|Tapani|cl|L13
Sorfina||ir|O8
Sorgal|Mieru'kar|or|N4
Sorgan|Karthakk|or|Q17
Sorimow|Pacanth Reach|or|H16
Sorjus|Meridian|or|R7
Sorl|Dantus|or|J6
Sormahil|Corva|or|P3
Sorotarr|Yushan|mr|K17
Sorrus|Kalamith|or|O5
Sortuvia|Xappyh|or|Q3
Soruus|Cronese Mandate|or|S6
Soterios|Tapani|cl|L13
Soul's Lament|Greater Plooriod|ex|M7
Soule||co|L12
Soullex||ws|P3
Soun||ex|J8
Space Station Scardia Null Zone||ex|P12
Space Station Trenchant|Trax|mr|Q10
Spaceport THX1138|Fath|or|K6
Spalex|Dantus|or|J6
Spangled Veil Nebula|Meridian|or|R7
Spanthaer||ir|N9
Sparingia||co|L13
Sparth|Prefsbelt|or|K6
Spawn|Nebula Corva|or|P4
Speco|Bon'nyuw-Luq|or|N18
Spee|Saijo|or|K20
Spefik|Atrivis|or|L5
Spellhaus|Meerian|or|O6
Sperin|Bajic|or|P17
Spice Terminus|Parmic|or|P18
Spillwater|Candoras|or|J5
Spinax|Allied Tion|or|S6
Spindrift|Rseik|or|N20
Spintir|Spadja|or|Q6
Spira Lytton||co|L10
Spirador|Tandon|mr|Q14
Spirana||ir|N13
Sposia|Chiss Space|ur|F8
Sprizen|Sprizen|or|N5
Spuma|Seswenna|or|M18
Spunchina||ws|H17
Spur, The|Quence|or|O18
Squamat|Mayagil|or|M18
Squan|Station (Arboo)|or|S16
Squarr|Atrivis|or|L5
Sran|Ash Worlds|or|T6
Sriluur|Tharin (Periphery)|or|S8
Sronk|Oplovis|or|M5
Ssi-ruuvi|Cluster|ur|C16
Ssori|Klina|or|S13
Staggec|Bajic|or|P17
Stalimur|Tion Hegemony|or|S6
Stalsinek|Hapes Cluster|ir|O9
StarForge Nebula|Ado|mr|M17
Starlag|Hevvrol|mr|O15
Starlyte Station|Ado|mr|M17
Starport Borgo|Oricho|or|M6
StarStation 12||ws|O20
Starswarm Cluster|Koros|dc|L10
Stassia||dc|L10
Station 88|Vorc|mr|J7
Station Zeta||ir|K14
Steelious||co|K13
Steergard|Woostri|ex|M16
Stellan|Hunnoverrs|or|R16
Stend|Juris|or|P17
Stennaros Har|Worlds (Stennes)|ex|K16
Stenness|Airon|ir|O10
Stenos|Spadja|or|R5
Stensen's Colony|Stensen|or|I16
Sterdic|Ryndellian|mr|P17
Stewjon||dc|M10
Stic|Xappyh|or|Q3
Stieg|Calaron|or|T9
Stivic Garwian Unity*||ur|D8
Stobar|Boeus|ex|M15
Stoga Bitrose||or|T17
Storinal|Noonian|or|N6
Storthus|Churba|mr|P15
Stovax||co|J10
Stradtofen Cluster|Varada|or|I20
Strata||ir|L8
Stribos||co|M10
Strokill Prime|Calamari|or|U6
Stygeon|Nuiri|or|Q6
Stygian Caldera|Esstran (Sith Worlds)|or|R5
Stygmarn|Tarabba|or|N19
Stylar|Nebula Corva|or|P4
Styx|Baxel|or|U11
Suarbi|Quence|or|O19
Suba|Atravis|or|L19
Subterrel|Subterrel|or|L20
Sucharme|Grohl|or|R15
Sufezz|Jubilar|or|T8
Suhuurmin|Quence|or|P18
Sukkult||ir|L14
Suliana|Senex|mr|L18
Sulloria|Svivreni|or|O19
Sullust|Brema|or|M17
Sulorine|Suolriep|or|S7
Sumarin|Abrion|or|S15
Sumitra|Sumitra|ex|N7
Sump|Koradin|or|I18
Sunaj|Videnda|or|L18
Sundered Veil, The|Phelleem|or|S7
Sunin|Tharin|or|S8
Sunrise||ur|F7
Sunshi|Rseik|or|N20
Suntilla||cl|N12
Suolriep|Suolriep|or|S8
Surakkea|Terr'skiar|mr|P10
Suraz|Kalamith (Mirrin)|or|P5
Surcaris|Trans-Vulta|mr|O7
Surd Nebula|Atravis|or|L19
Surdapan Station|Ojoster|or|N7
Suria|Bajic|or|P17
Surpossia|Cyrillian Protectorate|ex|O12
Surron|Surron|ex|O13
Suurja|Ojoster|or|N7
Sva'leer|Corva|or|P3
Svaaha||co|K9
Svivren|Svivreni|or|O19
Svolten|Esstran (Sith Worlds)|or|R4
Swarquen|Videnda|or|M18
Swedlan|Kathol|or|M21
Swellen|Airam|or|L20
Switchmount|Gendius|mr|J17
Sy Myrth|Jospro|or|S7
Syboona|Danjar|or|N18
Symbia|Koros|dc|K10
Syndaar|Thrasybule|or|P6
Syned|Grumani|or|N17
Syngia|Sertar|or|R5
Syni||ws|P19
Synistahg|Lothal|or|U7
Synjax|Maldrood|mr|R7
Syruss|Pakuuni|or|T5
Syvris|Al'Nasrl|or|T13
T'olan Tiala||mr|K7
T'surr|Nuon e Safyd|ex|P12
Ta'klah|Jjannex|or|L18
Taanab||ir|O8
Tabiid|Perkell|mr|Q7
Taboon|Airon|ir|O10
Taborin|Mayagil|or|M18
Tah'Nuhna|Haserian|mr|Q14
Tahina|Chorlian|or|R4
Tahini||ir|L14
Tahlboor|Thanium|or|R5
Tais Brabbo|Shadola|or|U8
Taka Shier|Tharin|or|S8
Takobo|Noonian|or|N6
Takodana|Tashtor|mr|J16
Tal Nami||hs|R9
Tal Pi|D'Astan|or|P5
Tala||ir|N9
Talasea Morobe||cl|N11
Talay|Dufilvian|mr|Q16
Talcene|Talcene|mr|Q8
Talcharaim|Hapes Cluster|ir|O9
Talcim Cluster|Cegul|or|M20
Taldorrah|Baroli|ex|N14
Taldot|Taldot|mr|Q9
Talesia|Sarka|mr|Q8
Talfaglio|Corellian|co|M11
Talhovi|Juvex|mr|L18
Talir|Tharin (Karstaxon)|or|S8
Talivar|Chorlian|or|S4
Tallaan|Tapani|cl|L13
Tallaso|D'Aelgoth|mr|K17
Tallek|Dalicron|or|K19
Tallia||co|K10
Talofan|Bajic|or|P18
Talor|Varada|or|H19
Taloraan||ex|I15
Taloron||ws|I6
Talpiddi|Koradin|or|I18
Talravin||co|M10
Talrezan|Tandon|mr|Q14
Taltos|Ado|mr|M17
Talu|Ojoster|or|N7
Talvaria|Phelleem|or|S7
Tamazall|Boeus|ex|M15
Tamban||co|K10
Tamber|Tapani|cl|L13
Tamboon|Tungra|or|K19
Tambor Station|Belasco|ex|P11
Tammar|Tharin|or|T8
Tammuz-an|Tammuz|or|T14
Tamra|Tolonda|or|Q17
Tamsye Prime|Thanium|or|R5
Tanaria|Esuain|mr|P7
Tancon|Koradin|or|J18
Tanda|Tapani|cl|L13
Tandankin|Spadja|or|R6
Tandgor|Sertar|or|R5
Tandhor|Kwymar|or|P4
Tandis||ir|N8
Tandun|Kalamith|or|P5
Tangar|Fath|or|K6
Tangenine Tangenine||co|M12
Tanger|Tapani|cl|L13
Tangrada-Nii||co|K13
Tangrene|Morshdine|or|O4
Tanis|Atravis|or|L19
Tanjay||co|K9
Tanquilla Beach|Kathol|or|M21
Tansyl|Iskin|mr|O16
Tanta Aurek|Grumani|or|M17
Tanta Besh|Grumani|or|M17
Tantajo|Halori|mr|P7
Tantara||ir|K8
Tanthior|Corellian|co|M11
Tantiss Station|Dalonbian|or|M3
Tantive|Kwymar|or|Q4
Tanto Winn|Alui|mr|O17
Tantra|Tantra|or|M19
Tantsor||ur|I5
Tanya|Tapani|cl|L13
Tanzis|Tapani|cl|L13
Tao-Grant|Manda|mr|R15
Tar Morden|Vensensor|ex|K16
Tarabba Prime|Tarabba|or|M19
Taral|Calamari|or|U7
Taraloon|Surron|ex|O13
Taratos||ir|J14
Tarawa|Steniplis|or|L19
Tarchalia Luuq||mr|L7
Targappia||cl|N12
Targarth|Corosi|or|M6
Targonn||or|U7
Targusian|Rayter|or|J19
Targyon|Nembus|or|P5
Tarhassan|Harron|ex|O11
Taria|Lifh|mr|R8
Taris|Ojoster (Taris)|or|N7
Tarivo|Lantillian|mr|P9
Tarkenia|Karthakk|or|Q17
Tarlandia||co|L9
Tarlia|Dalicron|or|K20
Tarmidia|Kailion|ex|O13
Tarn|Doldur|mr|P15
Tarnith|Ojoster|or|N7
Tarnoonga|Arkanis|or|R17
Tarolax|Jidlor Marches|mr|I15
Taronda|Corbett|mr|I17
Taroon|Rseik|or|N20
Tarsa|D'Aelgoth|mr|L17
Tarshan|Maerdocian|mr|Q12
Tarsunt|Bothan|mr|R14
Tartaglia|Hollan|mr|M7
Tartaria|Alderaan|co|M10
Tas-La||hs|S9
Tasariq||ir|J14
Tascollan Nebula|Abrion|or|S15
Tashtor Seneca|Tashtor|mr|J16
Taskeed|Tharin|or|S7
Taspir Dynali||or|J3
Tasrin||cl|N10
Tassahondee Station|Parmel|or|O18
Tassar|D'Astan|or|P5
Tassio Moon|Kuat|co|M10
Tastiged|Oricho|or|M6
Tatooine|Arkanis|or|R16
Tauber Jaso||ir|L14
Tavitz|Tapani|cl|L13
Tavya|Tapani|cl|L13
Taw Provode|Nuiri|or|Q6
Tawl|Tungra|or|K18
Tay'ah'loo|Elbaran|mr|J17
Tazan|Merthian|ex|N13
Tcoleet||cl|N10
TD-10036-EM-1271|Montitian Grant|ex|J15
Te Hasa|Veragi (Gree Enclave)|or|K2
Teagan|Kwymar|or|Q4
Teardrop|Shelsha|cl|M9
Tebru|Juris|or|P17
Tedel|Ehosiq|ex|L8
Tedonia|Khuiumin|or|O18
Teedio|Auril|or|R7
Teevan|Kalamith|or|P5
Tefau|Suolriep|or|S9
Tegrat|Koradin|or|J18
Teh'Jar|Minos Cluster|or|M20
Tehar||mr|I7
Tei-Untis||co|K10
Teirasa|Iskin|mr|O16
Teklos||ir|L14
Tekurr'k|Senex|mr|L18
Tel|Halthor|or|L6
Tel Minor|Brak|ex|O14
Telanka|Svivreni|or|O19
Telaris|Pakuuni|or|T6
Telepan||co|M11
Telerath|Nouane|ir|N7
Teljkon|Kossa|ex|O11
Telkadis|Greater Plooriod|ex|M7
Telkur Station|Hapes Cluster|ir|O9
Tellanada|Bruanii|mr|K18
Tellanroaeg|Gaulus|or|S17
Tellik||ir|N7
Tellivar||cl|M9
Tellon|Sombure|mr|K17
Teloc Ol-sen|Eclorar|mr|Q12
Telos|Kwymar|or|Q4
Telti||ir|N10
Temako|Antemeridian|or|R7
Temerancé|Merel|or|Q19
Temesher|Lantillian|mr|P9
Tempes|Atravis|or|L20
Tenara|Gordian Reach|or|Q6
Tendo|Quess|mr|N17
Tenoo|Bri'ahl|or|I17
Tensor||co|M10
Tentator||cl|L9
Tentraxis||ir|N9
Tentrix|Baroli|ex|N15
Tenupe||ws|I8
Tepasi Tagge|Space|co|L9
Teptixii||ur|I4
Ter Abbes|Locris|ex|O8
Teralov|Ash Worlds|or|T6
Terephon|Hapes Cluster|ir|O9
Teres Lutha Minor|Farrfin|co|K9
Tergamenion|Grumani|or|M17
Teriona|Spirva|mr|L17
Teriq Noi Trailing|Grant|ex|J15
Terman|Tharin (Periphery)|or|S8
Terminus|Kallea|or|K20
Ternin|Alchenaut|ex|L16
Terr'skiar|Terr'skiar|mr|P10
Terra Sool|Immeria|ex|O14
TerraAsta||cl|L9
Terrelia||ir|L14
Terrijo|Venzeiia|ex|O12
Tertiary Feswe|Gordian Reach|or|P6
Tertiary Fujar|Tamarin|or|N19
Tertiary Kesmere|Raioballo|or|L4
Tertiary Usaita||ir|M13
Tervissis|Sertar|or|R5
Tessen|Phelleem|or|S7
Teth|Baxel|or|U12
Tetso||co|M10
Tevel|Prefsbelt|or|J5
Tevraki||cl|N9
Tevu|Arc d'Stot|ex|K16
Teya|Lostar|ex|M7
Teyr||cl|L13
Th'irus||ws|S4
Thabeska|Morshdine|or|O5
Thabit||ir|M14
Thaere|Thaere|ex|O14
Thairwsthis|M'shinni|mr|M7
Thakwaa|Tunka|or|I19
Thalassia|Meram|or|P4
Thaldo|Graador|mr|J17
Thandon Nebula|Corporate Sector|or|S3
Thandruss|Thand|ex|J15
Thanium|Thanium|or|R6
Thannt|Ryndellian|mr|O17
Thanta Zilbra|Xappyh|or|Q3
Thape|Lambda|mr|Q15
Tharados|Onatos|mr|R15
Tharben|Kastolar|mr|R10
Tharkos|Thanium|or|R6
Tharl|Zuma (Sugai)|or|H16
Tharnaka|Seitia|or|K19
Thassalia|Albanin|or|U12
Thaylia|Sprizen|or|N5
Theal||mr|J15
Thearterra|Chiss Space|ur|E8
Thebeon||co|K12
Thedavio||ex|I8
Thela|Aparo|or|R4
Thelj|Airam|or|M20
Thelpi||ir|K14
Themis||ir|L15
Thennqor|Sarka|mr|Q8
Therenor|Doldur|mr|P15
Thermon|Juvex|mr|L17
Theron|Vilonis|mr|O16
Theros Major|Hollan|mr|M7
Theselon|Hapes Cluster|ir|O9
Thesme|Thesme|or|O5
Thession|Bortele|mr|S8
Thiafeña|Mulgard|mr|N16
Thila|Illisurevimurasi|or|Q4
Thisspias|Farstey|ex|O8
Thixia|Alderaan|co|M10
Thoadeye||dc|M11
Thobek|Farlax|co|K10
Thodia|Perkell|mr|Q7
Thokos||co|L9
Thokosia|Maerdocian|mr|Q13
Tholatin|Mytaranor|mr|P10
Tholaz|Farlax|co|K10
Tholian|Meram|or|P4
Tholon||ws|H17
Tholoth||cl|N12
Thomork||co|L12
Thomquizzar|Meerian|or|O6
ThonBoka Nebula|Centrality|or|U8
Thonner|Zuma (Moddell)|or|H16
Thoran|Bothan|mr|R14
Thorat|Galov|or|T14
Thorgeld||co|L9
Thornhedge Nebula|Terr'skiar|mr|P10
Thorsgild|Meerian|or|N7
Thorum|Vendusii|mr|P16
Thory Prime Thory||mr|K7
Thosa|Wyl|or|R4
Thousand Moons|Circarpous|ex|O12
Thovinack|Kanz|or|N4
Thracior||co|K12
Thrad|Phelleem|or|S7
Thrago|Chiss Space|ur|H8
Thraisai||ws|U9
Thrakia|Hapes Cluster|ir|O9
Thrantin Ollonir Boundaries||cl|J9
Threfal|Iska|mr|J16
Threndria|Yminis|or|S15
Thrinittik||cl|L8
Throffdon||ir|J9
Throova||cl|M12
Thrugii|Kibilini|or|Q17
Thrynka|Dohlbani|mr|R14
Thule|Esstran|or|Q5
Thulia|Kurost|mr|Q12
Thull's Shroud|Senex|mr|L17
Thull's Vault|Juvex|mr|K18
Thumbsnapper's Bridge|Phelleem|or|S7
Thuna||ws|I6
Thune|Wazta|or|I18
Thurhanna Minor|Tynquay|or|R4
Thustra|Sumitra|ex|O7
Thyferra Jaso||ir|L14
Thyron||cl|M9
Thyrsus||ir|M8
Tibrin|Hadar|mr|L18
Tibro Baronos||cl|N9
Tiems|Belderone|or|R6
Tieos|Abrion|or|S15
Tierell|Thesme|or|O6
Tierfon|Sumitra|ex|O7
Tiferep Major|D'Aelgoth|mr|L17
Tifnyl|Elrood|or|M19
Tiikae|Koradin|or|J18
Tiisheraan||co|L13
Tikath|Noonian|or|M6
Till|Chorios Meridian|or|R6
Tillo|Tapani|cl|L13
Tilth||cl|M12
Tilurus|Kessel|or|T10
Timbra Ott|Kathol|or|M21
Timja|Suolriep|or|S8
Timora|Bakura|or|G16
Tinallis|Juvex|mr|L18
Tinia|Zeemacht Cluster|ir|N8
Tinnel Quanta||co|M12
Tinoon|Javin (Anoat)|or|K18
Tinta|Hapes Cluster|ir|O9
Tintel|Belasco|ex|P11
Tinuvia|Tragan Cluster|or|N5
Tion|Tion Hegemony|or|S5
Tirac Munda|Hevvrol|mr|P15
Tiragga|Mieru'kar|or|N3
Tirahnn|Zeemacht Cluster|ir|N8
Tirn|Esstran|or|Q5
Tirsa|Corporate Sector|or|S4
Tisht||hs|T11
Tiss'sharl|Xappyh|or|R4
Tizon|Farlax|co|K10
Tlactehon|Kailion|ex|O13
Tlönia|Demetras|or|P7
To'hok Neige|Kriz|or|J18
Tocan|Sumitra|ex|N7
Tocco|Tapani|cl|L13
Tocoya|Ktilac Regions|ir|N9
Todirium|Demetras|or|P7
Todola|Albarrio|or|K5
Todouhar|Seswenna|or|M18
Togominda|Javin (Yarith)|or|K18
Togoria|Taldot|mr|P9
Tokmia|Javin (Anoat)|or|K18
Tokuut|Demetras|or|P7
Tol Ado|Seitia|or|K19
Tol Amn||hs|R11
Tolan||cl|L9
Toledian|Narrant|mr|I16
Tolfrania||ir|N9
Tolig|Mayagil|or|N18
Tollello|Dail|or|Q18
Tomark|Ividal|mr|Q14
Tomo-Reth||ir|L14
Ton-Falk|Pakuuni|or|T5
Tonnis Tonnis||ir|I9
Toola|Nilgaard|or|S5
Tooma|Colundra|or|S5
Toong'l|Jubilar|or|T7
Toorja|Tapani|cl|L13
Toprawa|Kalamith|or|P5
Torch Nebula|Torch Nebula|or|P19
Toria-vic|Nebula|ws|S3
Torina|Elrood|or|M19
Torize|Kathol|or|M21
Torku||ir|M13
Tormin|Prackla|ex|O8
Torn Station|Mytaranor|mr|P10
Torolis|Bothan|mr|Q13
Torost|Bryx|mr|R7
Torphlus|Roche|mr|Q8
Torpris|Uoti|co|K9
Torque|Gordian Reach|or|P6
Torrad|Talcene|mr|Q8
Torrenoteer|Spadja|or|R5
Torria||co|M12
Tortali|Airam|or|L19
Torve|Brak|ex|O14
Toshara|Cadma|or|T8
Toskhowwl|Ottega|mr|M6
Tosste|Atravis|or|L19
Tothis|Corporate Sector|or|S3
Touksingal|Corva|or|P3
Tourani|Yucrales|mr|R15
Tovarskl||ws|J4
Tovash Tchii|Alui|mr|O17
Tovio|Aida|mr|Q13
Toydaria||hs|R11
Tozeer|Hunnoverrs|or|R16
Tozil|Tashtor|mr|J16
Tragrud|Tharin (Periphery)|or|S8
Trailia|Lothal|or|U7
Tralfin|Xappyh|or|Q3
Tralgaria|Parmic|or|P18
Trallan||cl|K9
Tramanos|Grumani|or|N17
Trammen|Harron|ex|O11
Trammis|Centrality|or|U8
Tran Mariel|Farlax|co|K10
Tranchar|Belderone|or|R6
Trancret|Perkell|mr|Q7
Transel||cl|L13
Tranthellix|Senex|mr|L18
Trantor||co|M10
Traptoforia|Thrasybule|or|P6
Trascor|Corva|or|P3
Trasemene|Phelleem|or|S7
Trasse|Sarka|mr|Q8
Trassitan|Veragi|or|L3
Traval-Pacor Pacor||mr|K7
Travnin|Minos Cluster|or|M20
Travyx|Halm|mr|J16
Trebela|Altier|ex|O13
Treffani Treffani||ex|O14
Tregillis|Tregillis|ex|M15
Trellen||co|M10
Trenchenovu|Kriz|or|K19
Trendivar|Hunnoverrs|or|R16
Trenwyth|Stensen|or|I16
Tresidiss|Quence|or|P18
Trevi|Quess|mr|N17
Trevura||ir|K14
Treylon||cl|L13
Tri-Barr|Station|ir|N11
Trian|Trianii Space|ws|R3
Triellus|Jospro|or|R7
Triewahl|Homon|mr|M7
Trif|Ciutric|or|N4
Triffis|Hevvrol|mr|O15
Trigalis|Juris|or|P17
Trigaskian Blur||ws|W10
Triitus|Corva|or|P4
Trillia|Imberlin|ex|P13
Trindello|Zuma (Moddell)|or|H16
Trinith Mondress||ex|I7
Trinovat|Gordian Reach|or|P6
Trinta|Halthor|or|L6
Trionak|Javin (Yarith)|or|J18
Tristall||cl|L9
Triton|Mayagil|or|M18
Trivar|Nuiri|or|Q6
Trogan|Jospro|or|R7
Troglofa|Belderone|or|R6
Troika|Colundra|or|S5
Troiken|Colundra|or|S5
Troos|Gordian Reach|or|Q5
Trosh|Cegul|or|L20
Troska|Dantus|or|J6
Troxar|Bes Ber Bikade|ex|L15
Trundalki|Xan|mr|Q15
Trunska||cl|J13
Trupellia||cl|M13
Truuine||ir|O11
Truuzdann|Corellian|co|M11
Truvi|Atravis|or|L20
Truwel|Videnda|or|L18
Trydara|Barsa|mr|J6
Trymant|Subterrel|or|L20
Tsaokallus|Talcene|mr|R8
Tsevuka|Cademimu|or|M6
Tsoss Beacon||dc|L11
Tsukimitsurin|Churnis|mr|J6
Tsukkia|Fakir|cl|K9
Tsyk||hs|T13
Tu'oon|Juris|or|P17
Tuerto|Brema|or|M17
Tujiamoor||ir|K14
Tulatharri Junction|Veragi|or|K3
Tulpi||ir|N13
Tumani|Hapes Cluster|ir|O9
Tumus|Tapani|cl|L13
Tun Wala|Ktilac Regions|ir|N9
Tund|Centrality|or|U8
Tungra|Tungra|or|K18
Tunguray|Brema|or|M17
Turak|Parmel|or|O18
Turcan|Parmel|or|O18
Turclom|Dustig|mr|N16
Turco Prime|Sarka|mr|Q8
Tureen|Kriz|or|K19
Turkana|Pakuuni|or|T6
Turrak|Tamarin|or|N19
Turrani|Bheriz|or|U11
Tusken's Eye||ws|I8
Tuttin||ir|M14
Twilight Void,|The|ur|D7
Twin Nebulae|Javin|or|K18
Twin Sun|Station Garis|or|N17
Twins, The|Obtrexta|or|K4
Twith||co|K9
Twon Ketee|Quence|or|P18
Tyan Tyan||mr|K7
Tyaonon||ws|R18
Tyberious||ir|L8
Tydane|Bryx|mr|R7
Tyed Kant||co|M10
Tyegin||ir|O10
Tyluun|Juvex|mr|L18
Tyne Albamon|Rseik|or|N20
Tyne's Horky|Teraab|mr|Q11
Tynna|Tynna|ex|N14
Typhonic Nebula|Trax|mr|Q11
Tyrellia|Minos Cluster|or|M20
Tyria|Hevvrol|mr|P15
Tyrusia||ir|N8
Tyshapahl|Kalamith|or|P5
Tythe|Savareen|or|Q16
Tython||dc|K10
Tyus Cluster|Tyus|mr|N16
Tyybann||ir|J13
Tzarib Mestani||ir|J9
U-Tendik|Trans-Nebular|mr|Q16
U'Dray|Hook Nebula|or|O18
Uaua|Centrality|or|U8
Uba|Barsa|mr|J6
Ubardia||cl|N12
Ubduria||ir|N8
Ubertica|Barsa|mr|J6
Ubrikkia|Kastolar|mr|Q10
Ubuuga|Halori|mr|Q7
Ucret||co|K10
Udine||ir|M15
Udnil|Airam|or|M20
Udrin Cara|Lannik Wilds|mr|R13
Ueda|Xappyh|or|Q3
Uhltenden|Thrasybule|or|P6
Ukatis||ir|L15
Ukio|Abrion|or|S15
Ulda Frav|Hangshan|ex|P11
Ulicia|Corporate Sector|or|S3
Ulion|Kuat|co|M10
Ulkantha|Tharin|or|S8
Ulmatra||hs|S10
Ulness Prime|Merthian|ex|N13
Ultaar|Bortele|mr|R8
Umaren'k||ur|G9
Umbara|Ghost Nebula|ex|P10
Umgul|Mulgard|mr|N16
Umme|Trilon|or|G15
Umthyg|Juvex|mr|K18
Unagin|Al'Nasrl|or|T13
Unavartan|Gaulus|or|S17
Unguule|Nebula|ws|I20
Unnipar||ws|H19
Unox|Astal|or|P18
Unroola Dawn|Doldur|mr|P15
Unzel|Lantillian|mr|P9
Uogo'cor|Trax|mr|Q10
Uokara||ur|H6
Upekzar|Esstran (Sith Worlds)|or|R5
Upell|Agarix|mr|K18
Uphrades||ir|M8
Upper Brightday|Trestis|ex|K8
Upper Etrega||cl|M10
Uquine||cl|N10
UR-1060|Zuma (Moddell)|or|H16
UR-2212-GR||ur|H6
UR-2650|Zuma (Moddell)|or|H16
UR-3741|Zuma (Moddell)|or|H16
UR-5292-FH||ws|H7
UR-6572-AK||ur|G8
UR-8827|Zuma (Moddell)|or|H16
UR-9353|Zuma (Moddell)|or|H16
UR41-284||ur|G8
Urajab|Vulcusion|ex|L16
Urber|Videnda|or|L18
Urce|Urce Space|mr|L6
Urch Tower Dimension*||ur|F7
Urdur|Corporate Sector|or|S4
Uridia|Yucrales|mr|R14
Uriek|Ash Worlds|or|T7
Urkupp|Auril|or|R6
Urn-Aram|Wazta|or|I17
Uro|Wazta|or|I17
Ursellin|Noolian|mr|Q13
Urthak|Gendius|mr|J17
Uru|Atravis|or|L19
Urun|Belasco|ex|O11
Usean|Tunka|or|I18
Useria||ir|N9
Ushmin|Relgim|or|K4
Ushruu|Altier|ex|O13
Usk||hs|T10
Usnia|Senex|mr|L18
Usta|Gordian Reach|or|Q6
Ut|Hapes Cluster|ir|O9
Utapau|Tarabba|or|N19
Utaruun|Arkanis|or|R16
Utegetu|Nebula|ws|I8
Utharis||co|K10
Uthor|Agarix|mr|K18
Uthtara|Eucer|mr|R7
Uthura||ir|M13
Utor||ir|L15
Utrica|Tamarin|or|N19
Utrost|Corusca (Coruscant)|co|L9
Uukaablis|Kathol|or|M21
Uvadala|Ividal|mr|P15
Uvena|Seswenna|or|M18
Uveron||cl|M9
Uviuy Exen Shwuy||cl|L9
Uvoss|Cassander (Tadrin)|or|K5
Uyter|Lantillian|mr|P9
V'shar||ws|U15
Va'art|Roche|mr|Q8
Vaal|Gordian Reach|or|P5
Vaathkree|Tharin (Periphery)|or|S8
Vaced|Jalor|mr|J7
Vactooine|Arkanis|or|R16
Vadnay|Spinward|or|M2
Vadooria|Halla|mr|S9
Vadran|Rago|mr|I7
Vaenrood|Pakuuni|or|T6
Vagadarr||ir|K14
Vagar Praxut||ur|H9
Vagneria||co|K12
Vagran|Corellian|co|M11
Vahaba|Quelii|or|N6
Vakkar|Fakir|cl|K9
Vaklin||ir|M14
Valahari|D'Astan (Valahari)|or|N5
Valashar|Churnis|mr|I7
Valboraan|Kastolar|mr|R10
Valc|Perinn|or|J4
Vale|Atravis|or|L19
Valera||cl|L13
Valfin|Meram|or|O4
Valgauth|Nojic|ex|P9
Validusia|Bes Ber Bikade|ex|L15
Vallt|Juris|or|P17
Vallusk Cluster|Gordian Reach|or|Q6
Valnoos|Morshdine|or|O5
Valo|Rseik|or|N19
Valorsi|Juvex|mr|L17
Valrar|Glythe|mr|J7
Valron|Rocantor|ex|L15
Valsedian||hs|S11
Valtava Valtava||ir|I8
Valtha Divide||ws|S4
Valtos||ws|I8
Vanahame|Grumani|or|N17
Vanan|Atravis|or|L19
Vanaria|Rseik|or|N20
Vandelae||ir|O10
Vandelhelm|Epsi Collective|ex|M15
Vandin|Tharin|or|S8
Vandor|Sloo|mr|P14
Vandos|Nuiri|or|Q7
Vandron|D'Aelgoth|mr|L17
Vandyne|Morshdine|or|O5
Vanguerre|Roche|mr|Q8
Vanik||ir|L14
Vanjervalis||cl|N11
Vannan|Nijune|or|O4
Vannix||co|M10
Vanooria||co|M10
Vanqor|Sertar|or|R5
Vanquo|Meerian|or|O6
Vantillia||ir|M13
Vanzeist|Suolriep|or|S8
Var-Shaa|Dustig|mr|N17
Varada|Varada|or|I19
Varadan|Senex|mr|L18
Vardos||co|L9
Vardoss|Vardoss|ex|J8
Vargos|Mortex|or|R5
Variax|Aldino|mr|J17
Varic|Chorlian|or|S4
Varkana|Quelii|or|O6
Varl||hs|S11
Varlinaar|Koradin|or|J18
Varn|Quelii|or|O6
Varnak|Kurost|mr|Q11
Varonat|Javin (Anoat)|or|K18
Varristad|Abrion|or|S15
Vartos|Tharin|or|S8
Varvrona|Obtrexta|or|K4
Varvva|Barsa|mr|J6
Vasar|Corellian|co|M11
Vasch|Arkanis|or|R17
Vasha|Zuma (Moddell)|or|H16
Vashka|Kibilini|or|Q17
Vassek|Wazta|or|I17
Vastrip||ir|N7
Vasuuli Kliap||cl|M9
Vatleria|Calaron|or|T9
Vatta||ws|M21
Vavarna|Jjannex|or|L18
Vaykaaris||cl|K13
Vaynai|Chorlian|or|S4
Veccacopia|Tunka|or|I19
Vectinia|Hewett|mr|M7
Vedis|Mayagil|or|N18
Veek|Weneen|or|N6
Veelo|Vorzyd|or|R6
Veil Nebula|D'Astan|or|N5
Veil, The|Farstey|ex|O8
Velabri||or|S18
Velanaria|Videnda|or|L18
Velex|Locris|ex|O8
Velga|Juvex|mr|L18
Vellas Pavo|Grumani|or|M17
Vellity|Trax|mr|Q10
Velmor|Halori|mr|P7
Velossia|Manda|mr|R15
Velusia||co|L9
Velx-Shel|Corellian|co|M11
Vena|Nojic|ex|P9
Venaari|Venaarian|mr|O8
Vendara|Kwymar|or|Q4
Vendaxa|Chaykin|ex|O14
Vendrak|Videnda|or|M18
Vendusii|Vendusii|mr|P16
Venedlia|Instrop|or|S16
Venerable Stirta|Ghost Nebula|ex|P10
Venestria|Clacis|or|K4
Vengler||ws|H18
Venir|Kuat|co|M10
Venjagga||cl|K9
Vensor|Vensori|mr|P8
Ventil|Trax|mr|Q10
Vento||co|L9
Ventooine|Corva|or|P3
Ventran|Var Hagen|mr|M16
Ventrillia||co|L12
Ventruun|Grumani|or|M17
Ventrux|Thesme|or|O6
Venustria||cl|N12
Venzeiia|Venzeiia|ex|O12
Veragi|Veragi|or|L3
Verdanaia||co|M11
Verdanth|Bon'nyuw-Luq|or|N17
Verde|Tharin (Periphery)|or|S8
Verdi|Rayter|or|J19
Verdoria||co|M11
Vergill|Hapes Cluster|ir|O9
Verig|Raioballo|or|L4
Verinti|Vorzyd|or|R6
Verisin|Bajic|or|P17
Verkuyl|Stensen|or|H17
Vernet|Baroli|ex|N14
Vernid|Kanz|or|M4
Veroleem||ur|I6
Veron|Senex|mr|L17
Veron Minor|Mektrun|mr|L17
Veronia|Oricho|or|M6
Veros|Dimean|ex|P13
Verossia|Strabin|mr|M7
Verroth|Belsmuth|or|O6
Vertseth||cl|N10
Verullia|Kira|ex|N15
Vesari||ir|O10
Vesla|Corosi|or|N6
Vesla|Minor|ws|I14
Vespaara|Suolriep|or|S8
Vessitoar|Ottega|mr|M6
Vestar|Rseik|or|N20
Vestor Nebula|Trans-Nebular|mr|R16
Vestral|Mortex|or|R5
Vetine Merrick||ir|L14
Vex|Zuma (Moddell)|or|H16
Vexar|Corporate Sector|or|S4
Vexos||ws|G14
Vexta|Carrion|or|J4
Viamarr||ir|N7
Vianax|Lol|or|Q18
Vicondor|Vorc|mr|J7
Videll||cl|M13
Vidicx|Eclorar|mr|Q12
Viga|Lostar|ex|M7
Viidaav|Bryx|mr|R7
Vilosoria|Lifh|mr|R8
Vincorba|Piryn Shar|ex|K16
Vindalia||cl|L13
Vinnax||ws|S3
Vinsoth|Quelii|or|N5
Vint|Sevetta|or|T16
Vinth|Venzeiia|ex|O13
Vintrus|Manda|mr|R15
Vinzen Neela|Parmic|or|P18
Vir Aphshire|Tharin|or|S8
Viraanntesse|Dona Laza|ex|P9
Virgillia|Koradin|or|I18
Viridia|Halthor|or|M6
Virkoi||ir|N9
Virmeude|Mayagil|or|M18
Virujansi||ir|O10
Vishay|Vish|mr|N16
Vispil|Thrasybule|or|P6
Visseon||ir|N10
Vivonah|Atravis|or|L19
Vixnix|Rago|mr|I7
Vixoseph|Tantra|or|M19
Viyent|Har Worlds|ex|J16
Vizcarra|Cegul|or|L20
Vjun|Nuiri|or|Q6
Vlemoth Port|Instrop|or|S16
Vnex|Gordian Reach|or|Q6
Vo Tunbren|Cegul (Tadra)|or|M20
Vob|Ktilac Regions|ir|N9
Vobes||co|J10
Vodran||hs|S9
Vogel|Var Hagen|mr|M16
Vohai|Parmel|or|O18
Void of Aogros||ws|H18
Void of Chopani|Chopani|or|L4
Void Station|Bothan|mr|R14
Voidfire Nebula|Palamut|ex|N13
Voktunma||co|M11
Volgax||co|K10
Volik||ur|H7
Volta|Chaykin|ex|O14
Voltare||ir|K8
Von-Alai|Locris|ex|O8
Vonak|Dalonbian|or|L3
Vondarc|Var Hagen|mr|M16
Vondoru||ur|G6
Voniss||mr|I7
Vontor||hs|S9
Voolukaria||co|K13
Voon Krenher||co|K9
Voorlach|Duluur|cl|M13
Voorsbain|Senex|mr|L18
Vor Deo|Arkanis|or|R17
Vorian|Immalia|ex|K8
Vorkaa|Graador|mr|I17
Vorlag|Thuris|or|P18
Vornax|Thanium|or|S5
Vorpa'ya|Mandalore|or|O7
Vorpal Nebula|Halthor|or|M6
Vorrnti||ir|L8
Vorsia||ir|N9
Vortex|Glythe|mr|K7
Vorusku|Juris|or|P17
Vorzyd|Vorzyd|or|R6
Vosch Cluster|Ado|mr|M17
Voss|Allied Tion|or|S6
Vosteltig|Oplovis|or|M5
Voxx Cluster|Ash Worlds|or|S7
Vr'gedia|Mytaranor|mr|P9
Vrakolia||co|K13
Vretha|Hollan|mr|M7
Vrogas Vas|Sujimis|or|O19
Vrosynri|Nijune|or|N5
Vryssa|Dalicron|or|K19
Vuchelle|Atrivis|or|L5
Vulcar|Juvex|mr|L18
Vulcusion|Vulcusion|ex|L16
Vulderania||co|L10
Vulpinus Nebula|Vatha|ex|K16
Vulpter||dc|L10
Vulta|Trans-Vulta|mr|N7
Vultar||co|L10
Vulvarch||cl|L13
Vuma||co|M10
Vun'Hanna||ur|D7
Vunakia|Phelleem|or|S7
Vundaria||ir|N9
Vur|Ojoster|or|N7
Vurdon Ka Darlonn||ir|M9
Vuundalla|Bri'ahl|or|I17
Vuzsa|Arkanis|or|R16
VV-99-7JE-2N71 Shiwal||mr|L7
Vvaw|Calaron|or|U9
Vycinyth|Tapani|cl|L13
Vykos|Relgim|or|L5
Vyndal|Chorlian|or|S4
Vyron|Kurost|mr|Q11
Wadi Raffa|Airam|or|M20
Wakeelmui||cl|L9
Wakiza|Farlax|co|K10
Walalla||ir|J13
Walin'or Shiwal||mr|M7
Wann Tsir|Sepan|ex|P13
Warchigade|Toblain|or|O18
Warlentta|Strabin|mr|M7
Warrin Station|Couronne|ex|P10
Wasco|Bri'ahl|or|I17
Waskiro|Jospro|or|R7
Wayland|Ojoster|or|N7
Waymancy||ir|K8
Wazta|Wazta|or|J18
Wecacoe||cl|K13
Weerden|Corusca|co|K9
Wehttam|Farlax|co|K10
Weik||ws|H20
Weldii||co|L13
Wells|Perkell|mr|Q7
Wellsia|Illodia|co|K13
Wellte-ir|Trax|mr|Q10
Welsl|Brak|ex|O14
Wen'he'dinae|Eidoloni|mr|L16
Wenderal|Aparo|or|R3
Werania Biivren||ex|P9
Werma|Xappyh|or|Q3
Werncin|Kwymar|or|Q4
Werta|Oriolan|mr|J16
Wetyin's Colony|Gordian Reach|or|Q5
Weytta|Auril|or|S6
Whassik|Perkell|mr|Q7
Wheel, The|Maldrood|mr|R7
Whelori||cl|K13
Whendyll|Cademimu|or|L6
Whiforla||ir|M13
Whinndor|Grumani|or|N17
Whirl,|The|ir|K8
Wick|Instrop|or|S16
Widek|Farlax|co|K10
Wielu||ir|N13
Wilpiet|Cademimu|or|M6
Winagrew|Graador|mr|J17
Winnikk|Sumitra|ex|O7
Winsit|Cegul|or|L20
Winter's Edge|Koradin|or|J18
Wistril|Fath|or|K6
Witch|Nebula|cl|L9
Wizar||ws|I8
Wobani|Bryx|mr|R8
Wodan|Hapes Cluster|ir|O9
Wodenstam|Skine|or|Q19
Wol Cabassh|Quelii|or|O6
Woldona|Sevetta|or|T16
Womrik|Dufilvian|mr|Q15
Woostri|Woostri|ex|M16
Woqua||co|K10
Wor Tandell|Dolomar|co|K9
Worru'du|Torranix|co|K10
Worxer|Elrood|or|M20
Woteba||ws|I8
Wranag|Bajic|or|P17
Wrea|Gaulus|or|S17
Wretch of Tayron|Videnda|or|L18
Wrodi|Meerian|or|O6
Wroona||ir|L15
Wrosdi|Spinward|or|N2
Wukkar||co|L10
Wxtm|Gaulus|or|R17
Wyloff|Wyloff|cl|L8
Wyndigal|Ash Worlds|or|S7
Wynkahthu|Alderath|mr|L7
Wynth|Wyloff|cl|L8
Wyveral|Homon|mr|M7
X3-299-11||ws|S4
Xa Fel|Kanchen|co|K9
Xagobah|Mayagil|or|M18
Xais|Yminis|or|S14
Xal|Zuma (Ablajeck)|or|H16
Xala||ws|H14
Xanas|Xan|mr|Q15
Xandil|Lambda|mr|P16
Xandonia|Askarian|ex|P11
Xandros|Locris|ex|O8
Xanlanner|Wyl|or|S4
Xantar|Corva|or|P4
Xartun|Ojoster|or|O7
Xaza|Xan|mr|Q15
Xend||ir|M8
Xendek|Calaron|or|T9
Xenxiar|Trax|mr|P10
Xeron||ir|M14
Xerthia||ir|K14
Xerton||ws|J3
Xerxes||co|M11
Xibariz||ir|O9
Xifal|Allied Tion|or|S6
Xilxash|Yminis|or|S15
Xirl||ws|O20
Xiunsrus|Quence|or|P18
Xivalia|Bes Ber Bikade|ex|L15
Xo|Spinward|or|N2
Xobome||cl|N10
Xochtl|Gordian Reach|or|P6
Xoemefel|Marzoon|mr|I16
Xolu||hs|S13
Xoman|Halla|mr|S9
Xorao|Mezeg|mr|M7
Xorrn|Ferra|or|S16
Xorth||co|L10
XT987||ir|J8
Xu'hu|Quiberon|or|S15
Xuaquarres|Ash Worlds|or|S7
XV-344H|Esstran|or|Q5
Xxan|Antemeridian|or|R7
Xyquine|Corellian|co|M11
Y'Dar|Astal|or|P17
Y'nybeth|Tokamac|ex|O13
Y'Trella|Sarin|or|P18
Yablari|Vorzyd|or|R6
Yabol Opa||cl|M9
Yabosta|Rocantor|ex|L15
Yabrenito|Semagi|mr|I16
Yag'Dhul||ir|L14
Yaga Minor|Prefsbelt|or|K5
Yagara|Hadar|mr|L17
Yaka||cl|M8
Yakorki|Pacanth Reach|or|G16
Yalara||ws|I21
Yalbec Prime|Rolion|or|P7
Yaled|Jubilar|or|T7
Yalln|Mortex|or|R5
Yama'chen|Nicandra|mr|L7
Yamradi|Varada|or|I19
Yan Korelda|Prefsbelt|or|J5
Yanibar||ws|R19
Yanis||co|L12
Yankirk|Ado|mr|L17
Yantha||ir|N8
Yar Togna|Sarin|or|P18
Yarille|Fath|or|K6
Yarith|Javin (Yarith)|or|J18
Yarma|Tharin|or|T8
Yarnil|Toblain|or|N18
Yaronn||ws|T5
Yarrv||co|K13
Yartiga|Spirva|mr|K17
Yashuvhu||ur|F9
Yasilor|Bajic|or|P17
Yathik|Boeus|ex|M15
Yavin|Gordian Reach|or|P6
Ychthyton|Belderone|or|R6
Yde|Nicandra|mr|M7
Yeksom|Antemeridian|or|R7
Yelsain|Minos Cluster|or|M20
Yerbana|Savareen|or|Q17
Yerej|Tungra|or|K18
Yerphonia||co|L9
Yeshocq|Mulgard|mr|N16
Yethra|Bon'nyuw-Luq|or|N17
Yetnis||ir|K8
Yetoom|Senex|mr|L18
Yev|Yushan|mr|K17
Yhifar|Juvex|mr|L17
Yhuli|Jospro|or|R7
Yinchorr|Fellwe|ex|L8
Yir Tangee||cl|L8
Yirt-4138-Grek-12|Fakir|cl|K9
Yisgga||ir|M13
Yitabo|Kastolar|mr|Q10
Yityl|Quence|or|O18
Ylagia|Rocantor|ex|L15
Ylesia||hs|T12
Ylix|M'shinni|mr|M7
Yllotat|Bothan|mr|R14
Yn||ir|K14
Yntrann||ws|O3
Yoberra|Airam|or|M20
Yoggoy||ur|H7
Yolthani|Nijune|or|N5
Yoon|Cloud|ws|V9
Yordain Core||ir|L15
Yorgraxx|Prefsbelt|or|K5
Yoribuunt|Tharin|or|S8
Yorn Skot||ir|N14
Yoturba||mr|I7
Yout Qiilura||mr|L7
Yrrna|Tamarin|or|N19
Ytha'ac Cluster|Airam|or|M20
Yuga|Sanbra|or|O17
Yugami|Atravis|or|L19
Yulant||co|L10
Yungbrii|Far Xandil|mr|O16
Yunkor|Jjannex|or|K19
Yurb|Suolriep|or|S10
Yutan|Ombakond|ex|P12
Yutusk|Mortex|or|R5
Yuvern|Oplovis|or|M5
Yuw|Herdessa|mr|Q16
Yvara|Kathol|or|M21
Ywllandr|Prefsbelt|or|K5
Z-LOQ|D'Aelgoth|mr|L17
Z'fell|Farlax|co|K10
Z'trop|Tamarin|or|N18
Zaadja|Savareen|or|R16
Zabba|Bheriz|or|T11
Zabian|Phelleem|or|S7
Zadaria|Hapes Cluster|ir|O9
Zaddja|Trilon|or|H15
Zairona|Bon'nyuw-Luq|or|N18
Zakuul||ur|D13
Zallo|Tamarin|or|N18
Zalori|Hapes Cluster|ir|O9
Zaloriis|Askarian|ex|P12
Zalso||co|M11
Zamael||dc|K12
Zanbar|Mandalore|or|O7
Zandrax|Nilgaard|or|T5
Zarak|Greater Plooriod|ex|M7
Zaraksander|Imberlin|ex|P14
Zardossa Stix||cl|J13
Zaria|Juvex|mr|L17
Zarkis|Suolriep|or|S9
Zarracina|Zarracina|ex|O14
Zarsteck||co|M12
Zastiga|Kallea|or|K20
Zav Alox|Trilon|or|H15
Zavian Abyss|Ghost Nebula|ex|P10
Zaxxovia|Gomar|ir|K14
Zayron|Corva|or|P3
Zchtek|Bortele|mr|R8
Zebitrope|Centrality|or|T8
Zeenada|Immerian Outback|ex|O14
Zeffo|Kanz|or|M3
ZeHeth|Dustig|mr|N16
Zeitooine||ir|N13
Zekulae|Zeemacht Cluster|ir|N8
Zelaba|Outer Jalor|mr|I7
Zelos|Tyus|mr|N16
Zeltros||ir|O10
Zemiah's Den||co|J12
Zenezia|Thand|ex|J15
Zenn-La|Venzeiia|ex|O12
Zenox|Cluster|cl|K13
Zeolosia|Mulgard (Hallu)|mr|N16
Zephry|Javin (Anoat)|or|K18
Zequardia|Dalchon|or|R17
Zerm|Kessel|or|T10
Zero Drift|Lantillian|mr|P8
Zeta 0-9||ws|K2
Zhadalene|Kanz|or|N4
Zhann||cl|M13
Zhanox|Javin (Anoat)|or|K18
Zhina|Farlax|co|K10
Zhotta|Mayagil|or|M18
Zi'Dek|Kallea|or|K20
Zigoola||ws|U6
Zimara|Calaron|or|U9
Zin Taal|Carrion|or|J4
Zinchori||ir|O9
Ziost|Esstran (Sith Worlds)|or|R4
Zipthar|Dalonbian|or|L2
Zircon|Calaron|or|T9
Zirulast|Belasco|ex|P11
Zisia||hs|S10
Zissh|Brevost|ex|O15
Ziugen||hs|T12
Zlarbv||ir|O10
Zobbera|Karthakk|or|Q17
Zoh|Sarka|mr|Q8
Zohakka|Corthenia|mr|K7
Zolan|Lambda|mr|P16
Zoma|Hunnoverrs|or|S17
Zona Miki|Thrasybule|or|P6
Zondula|Oriolan|mr|J16
Zongorlu|Noonian|or|M6
Zonju||ws|J21
Zoph|Wazta|or|J18
Zoraster|Zoraster|or|U13
Zorb|Meram|or|O4
Zorbia|Zuma (Moddell)|or|H16
Zosha||ur|F6
Zrak|Nijune|or|N5
Zuggit||ir|M13
Zuliria|Eucer|mr|R7
Zusi|Var Hagen|mr|M16
ZXK-100346|Atravis|or|L19
Zybahhod|Herios|or|T15
Zygerria|Chorlian|or|S4
Zygia|Manda|mr|R14
Zyluria|Juvex|mr|L17
Zyzar|Astal|or|Q17
Zyzek||ur|F9
Zznza|Yminis|or|S14
`;
  root.IAM_WORLDS = root.IAM_WORLDS || {};
  root.IAM_WORLDS.starwarsAtlasData = DATA;
})(typeof window !== 'undefined' ? window : globalThis);
