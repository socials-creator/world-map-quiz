#WhereintheWorld🌐

Amodern,pinch-zoomablegeographypointinggame.

Youaregivenacountrynameandmusttapthatcountryontheworldmap.

Thegameiscompletelyclient-sideandcanbepublisheddirectlythroughGitHubPages.

⸻

##V4Changes

###1.Fixedcountryselection

Thegamenowusesadedicatedtransparentinteractionlayerabovethevisualmap.

Thisprovides:

-ReliabletappingoniPhone
-Largertaptargetsforsmallcountries
-Pointer-basedtouchhandling
-Betterhandlingoftinyislands
-Separatevisualandinteractivemaplayers

Thevisiblecountrybordersremainthinwhiletheactualtouchareaislarger.

⸻

###2.India/Kashmirgameplayregion

ThefollowinggameplayregionisdisplayedusingIndia’scolor:

-JammuandKashmir
-Ladakh
-AksaiChin
-ShaksgamValley
-Pakistan-administeredKashmir

TheareaistreatedaspartofIndiaforthepurposeofthegame.

Asubtledashedoutlineisusedwhereappropriateratherthanusingthepreviousgreydisputed-regiontreatment.

Thisisagameplayvisualizationandisnotintendedtobealegalorpoliticalboundaryreference.

⸻

###3.Compactquestionbox

Thepreviousquestioncardcontained:

-Countrynumber
-Countryname
-Skipbutton
-Zoomhint

Thoseextraelementshavebeenremoved.

Thenewquestioncarddisplaysonlythecountryname.

Thismakesitsubstantiallysmallerandleavesmoreofthemapvisible.

⸻

###4.Countrycount

Thegameusesacanonicallistof:

195countries

Thisconsistsof:

-193UnitedNationsmemberstates
-Palestine
-VaticanCity

Territoriesanddependenciesarenotpresentedasindependentquizanswers.

Examplesinclude:

-PuertoRico→UnitedStates
-Greenland→Denmark
-Guam→UnitedStates
-Bermuda→UnitedKingdom
-HongKong→China
-Macau→China
-Frenchoverseasterritories→France
-Caribbeandependencies→theirsovereignstate

Thegamethereforedoesnotaskterritoriesasthoughtheywereindependentcountries.

⸻

##Mapdata

Thegameuses:

world-atlascountries-10m.json

fromtheworld-atlasproject.

The10mdatasetisusedbecausethehigher-resolutionNaturalEarthdataprovidesbettercoverageofverysmallcountriesandmicrostatessuchasMonaco,SanMarinoandVaticanCity.

NaturalEarthdistinguishesbetweencountrymapunitsandsovereignstates,whichiswhythisapplicationappliesitsowncanonicalcountrylistinsteadofsimplytreatingeverymapfeatureasanindependentquizanswer.

⸻

##Gamerules

Aroundbeginswhentheuserpresses:

Newgame

Thegamecontinuesuntil:

1.All195countrieshavebeensuccessfullyfound

or

2.Theplayerreaches5mistakes.

Acorrectselection:

-Adds1tothescore
-Flashestheselectedcountrygreen
-Movestothenextcountry

Anincorrectselection:

-Adds1mistake
-Flashestheselectedcountryred
-Zoomstowardthecorrectcountry
-Pulsesthecorrectcountry
-Movestothenextquestion

⸻

##Countryorder

Thenextquestionnormallycomesfromthesamebroadgeographicregionasthepreviousquestion.

Approximately72%ofthetimethegameremainsinthesameregion.

Theremainderofthetimeitjumpstoanotherregion.

Thispreventsthegamefrombecomingcompletelypredictable.

⸻

##Zoom

Themapsupports:

-Touchpinch-to-zoom
-Touchpanning
-Mousewheel/dragzoom
-Zoombuttons
-Resetzoom

Maximumzoom:

40×

Thisisparticularlyusefulfor:

-Monaco
-VaticanCity
-SanMarino
-Singapore
-Caribbeanislands
-Pacificislandcountries
-Portugal
-smallEuropeancountries

⸻

##Colors

Countriesareautomaticallyassignedcolors.

Thegamekeepscountriesfrombeingvisuallyidenticalwherepossiblewhilemaintainingawarmeditorialvisualstyle.

IndiaandthespecialKashmirgameplayregionintentionallyusethesamecolor.

⸻

##Files

index.html
style.css
script.js
README.md

⸻

##Runlocally

AnystaticHTTPservercanbeused.

Forexample:

cdgeo-game
python3-mhttp.server8000

Thenopen:

http://localhost:8000

⸻

##PublishonGitHubPages

1.CreateoropenyourGitHubrepository.

2.Replacethesefourfiles:

index.html
style.css
script.js
README.md

3.Committhechanges.

4.Open:

Settings→Pages

5.Under:

Buildanddeployment

choose:

Deployfromabranch

6.Select:

main
/
(root)

7.Save.

GitHubPageswillpublishtheapplication.

⸻

##Externallibraries

Theapplicationuses:

-D3.js
-TopoJSONClient
-world-atlas

TheyareloadedfrompublicCDNsanddonotrequireabuildsystem.

⸻

##Browserstorage

Thegamestores:

-Last10gameresults
-Highestscore

usingbrowserlocalStorage.

Noaccountorbackendisrequired.

⸻

##Importantmapnote

TheunderlyingNaturalEarth/world-atlasdatarepresentsgeographicboundariesaccordingtoitsowncartographicconventions.

ThisapplicationintentionallymodifiesthepresentationoftheKashmir/Ladakh/AksaiChin/Shaksgam/Pakistan-administeredKashmirgameplayregionsothatitisdisplayedusingIndia’scolorandtreatedaspartofIndiaforthegame.

Theresultingmapshouldthereforebeconsideredagameplaymap,notanauthoritativepoliticalorlegalboundarymap.

⸻

##Version

V4

MainV4improvements:

-ReliableiPhonetouchselection
-Largerinvisibletaptargets
-10mworldmap
-195-countrycanonicalquiz
-Territoriesexcludedasseparateanswers
-India-coloredKashmirgameplayregion
-Compactquestioncard
-Improvedsmall-countrysupport
-Improvedcountry-namenormalization
-Improvedcountryrevealandzoom