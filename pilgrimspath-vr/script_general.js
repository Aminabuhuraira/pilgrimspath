(function(){
let translateObjs = {};
const trans = (...a) => {
    return translateObjs[a[0x0]] = a, '';
};
function regTextVar(a, b) {
    var c = ![];
    return d(b);
    function d(k, l) {
        switch (k['toLowerCase']()) {
        case 'title':
        case 'subtitle':
        case 'photo.title':
        case 'photo.description':
            var m = (function () {
                switch (k['toLowerCase']()) {
                case 'title':
                case 'photo.title':
                    return 'media.label';
                case 'subtitle':
                    return 'media.data.subtitle';
                case 'photo.description':
                    return 'media.data.description';
                }
            }());
            if (m)
                return function () {
                    var r, s, t = (l && l['viewerName'] ? this['getComponentByName'](l['viewerName']) : undefined) || this['getMainViewer']();
                    if (k['toLowerCase']()['startsWith']('photo'))
                        r = this['getByClassName']('PhotoAlbumPlayListItem')['filter'](function (v) {
                            var w = v['get']('player');
                            return w && w['get']('viewerArea') == t;
                        })['map'](function (v) {
                            return v['get']('media')['get']('playList');
                        });
                    else
                        r = this['_getPlayListsWithViewer'](t), s = j['bind'](this, t);
                    if (!c) {
                        for (var u = 0x0; u < r['length']; ++u) {
                            r[u]['bind']('changing', f, this);
                        }
                        c = !![];
                    }
                    return i['call'](this, r, m, s);
                };
            break;
        case 'tour.name':
        case 'tour.description':
            return function () {
                return this['get']('data')['tour']['locManager']['trans'](k);
            };
        default:
            if (k['toLowerCase']()['startsWith']('viewer.')) {
                var n = k['split']('.'), o = n[0x1];
                if (o) {
                    var p = n['slice'](0x2)['join']('.');
                    return d(p, { 'viewerName': o });
                }
            } else {
                if (k['toLowerCase']()['startsWith']('quiz.') && 'Quiz' in TDV) {
                    var q = undefined, m = (function () {
                            switch (k['toLowerCase']()) {
                            case 'quiz.questions.answered':
                                return TDV['Quiz']['PROPERTY']['QUESTIONS_ANSWERED'];
                            case 'quiz.question.count':
                                return TDV['Quiz']['PROPERTY']['QUESTION_COUNT'];
                            case 'quiz.items.found':
                                return TDV['Quiz']['PROPERTY']['ITEMS_FOUND'];
                            case 'quiz.item.count':
                                return TDV['Quiz']['PROPERTY']['ITEM_COUNT'];
                            case 'quiz.score':
                                return TDV['Quiz']['PROPERTY']['SCORE'];
                            case 'quiz.score.total':
                                return TDV['Quiz']['PROPERTY']['TOTAL_SCORE'];
                            case 'quiz.time.remaining':
                                return TDV['Quiz']['PROPERTY']['REMAINING_TIME'];
                            case 'quiz.time.elapsed':
                                return TDV['Quiz']['PROPERTY']['ELAPSED_TIME'];
                            case 'quiz.time.limit':
                                return TDV['Quiz']['PROPERTY']['TIME_LIMIT'];
                            case 'quiz.media.items.found':
                                return TDV['Quiz']['PROPERTY']['PANORAMA_ITEMS_FOUND'];
                            case 'quiz.media.item.count':
                                return TDV['Quiz']['PROPERTY']['PANORAMA_ITEM_COUNT'];
                            case 'quiz.media.questions.answered':
                                return TDV['Quiz']['PROPERTY']['PANORAMA_QUESTIONS_ANSWERED'];
                            case 'quiz.media.question.count':
                                return TDV['Quiz']['PROPERTY']['PANORAMA_QUESTION_COUNT'];
                            case 'quiz.media.score':
                                return TDV['Quiz']['PROPERTY']['PANORAMA_SCORE'];
                            case 'quiz.media.score.total':
                                return TDV['Quiz']['PROPERTY']['PANORAMA_TOTAL_SCORE'];
                            case 'quiz.media.index':
                                return TDV['Quiz']['PROPERTY']['PANORAMA_INDEX'];
                            case 'quiz.media.count':
                                return TDV['Quiz']['PROPERTY']['PANORAMA_COUNT'];
                            case 'quiz.media.visited':
                                return TDV['Quiz']['PROPERTY']['PANORAMA_VISITED_COUNT'];
                            default:
                                var s = /quiz\.([\w_]+)\.(.+)/['exec'](k);
                                if (s) {
                                    q = s[0x1];
                                    switch ('quiz.' + s[0x2]) {
                                    case 'quiz.score':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['SCORE'];
                                    case 'quiz.score.total':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['TOTAL_SCORE'];
                                    case 'quiz.media.items.found':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['PANORAMA_ITEMS_FOUND'];
                                    case 'quiz.media.item.count':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['PANORAMA_ITEM_COUNT'];
                                    case 'quiz.media.questions.answered':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['PANORAMA_QUESTIONS_ANSWERED'];
                                    case 'quiz.media.question.count':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['PANORAMA_QUESTION_COUNT'];
                                    case 'quiz.questions.answered':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['QUESTIONS_ANSWERED'];
                                    case 'quiz.question.count':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['QUESTION_COUNT'];
                                    case 'quiz.items.found':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['ITEMS_FOUND'];
                                    case 'quiz.item.count':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['ITEM_COUNT'];
                                    case 'quiz.media.score':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['PANORAMA_SCORE'];
                                    case 'quiz.media.score.total':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['PANORAMA_TOTAL_SCORE'];
                                    }
                                }
                            }
                        }());
                    if (m)
                        return function () {
                            var r = this['get']('data')['quiz'];
                            if (r) {
                                if (!c) {
                                    if (q != undefined) {
                                        if (q == 'global') {
                                            var s = this['get']('data')['quizConfig'], t = s['objectives'];
                                            for (var u = 0x0, v = t['length']; u < v; ++u) {
                                                r['bind'](TDV['Quiz']['EVENT_OBJECTIVE_PROPERTIES_CHANGE'], h['call'](this, t[u]['id'], m), this);
                                            }
                                        } else
                                            r['bind'](TDV['Quiz']['EVENT_OBJECTIVE_PROPERTIES_CHANGE'], h['call'](this, q, m), this);
                                    } else
                                        r['bind'](TDV['Quiz']['EVENT_PROPERTIES_CHANGE'], g['call'](this, m), this);
                                    c = !![];
                                }
                                try {
                                    var w = 0x0;
                                    if (q != undefined) {
                                        if (q == 'global') {
                                            var s = this['get']('data')['quizConfig'], t = s['objectives'];
                                            for (var u = 0x0, v = t['length']; u < v; ++u) {
                                                w += r['getObjective'](t[u]['id'], m);
                                            }
                                        } else
                                            w = r['getObjective'](q, m);
                                    } else {
                                        w = r['get'](m);
                                        if (m == TDV['Quiz']['PROPERTY']['PANORAMA_INDEX'])
                                            w += 0x1;
                                    }
                                    return w;
                                } catch (x) {
                                    return undefined;
                                }
                            }
                        };
                }
            }
            break;
        }
        return function () {
            return '';
        };
    }
    function e() {
        var k = this['get']('data');
        k['updateText'](k['translateObjs'][a], a['split']('.')[0x0]);
        let l = a['split']('.'), m = l[0x0] + '_vr';
        m in this && k['updateText'](k['translateObjs'][a], m);
    }
    function f(k) {
        var l = k['data']['nextSelectedIndex'];
        if (l >= 0x0) {
            var m = k['source']['get']('items')[l], n = function () {
                    m['unbind']('begin', n, this), e['call'](this);
                };
            m['bind']('begin', n, this);
        }
    }
    function g(k) {
        return function (l) {
            k in l && e['call'](this);
        }['bind'](this);
    }
    function h(k, l) {
        return function (m, n) {
            k == m && l in n && e['call'](this);
        }['bind'](this);
    }
    function i(k, l, m) {
        for (var n = 0x0; n < k['length']; ++n) {
            var o = k[n], p = o['get']('selectedIndex');
            if (p >= 0x0) {
                var q = l['split']('.'), r = o['get']('items')[p];
                if (m !== undefined && !m['call'](this, r))
                    continue;
                for (var s = 0x0; s < q['length']; ++s) {
                    if (r == undefined)
                        return '';
                    r = 'get' in r ? r['get'](q[s]) : r[q[s]];
                }
                return r;
            }
        }
        return '';
    }
    function j(k, l) {
        var m = l['get']('player');
        return m !== undefined && m['get']('viewerArea') == k;
    }
}
var script = {"children":["this.MainViewer"],"watermark":false,"class":"Player","start":"this.init()","id":"rootPlayer","defaultMenu":["fullscreen","mute","rotation"],"data":{"defaultLocale":"en","history":{},"textToSpeechConfig":{"pitch":1,"speechOnInfoWindow":false,"speechOnQuizQuestion":false,"rate":1,"speechOnTooltip":false,"stopBackgroundAudio":false,"volume":1},"displayTooltipInTouchScreens":true,"name":"Player401","locales":{"en":"locale/en.txt"}},"backgroundColor":["#FFFFFF"],"hash": "ce913461650d15ccb6551c4c5059896de5158733767f56318ca71d914c11b281", "definitions": [{"data":{"label":"Crowd_Outdoor_ODY-0433-017"},"class":"MediaAudio","loop":true,"audio":"this.audiores_76887E08_7F58_F963_41C4_62CA1FA327C0","id":"audio_744C9484_7F58_2968_41D0_A756D310C079","autoplay":true},{"hfovMin":"150%","hfov":360,"adjacentPanoramas":[{"data":{"overlayID":"overlay_758FF68F_7F48_3697_41D1_E86A048611D9"},"distance":3.22,"class":"AdjacentPanorama","yaw":179.63,"select":"this.overlay_758FF68F_7F48_3697_41D1_E86A048611D9.get('areas').forEach(function(a){ a.trigger('click') })","panorama":"this.panorama_725CAFF3_71D8_1414_41C8_EBAEFE1538B9"}],"vfov":180,"id":"panorama_743170D8_7F48_6AB8_41C0_AAC239AE8EF7","thumbnailUrl":"media/panorama_743170D8_7F48_6AB8_41C0_AAC239AE8EF7_t.webp","hfovMax":130,"class":"Panorama","overlays":["this.overlay_758FF68F_7F48_3697_41D1_E86A048611D9","this.overlay_75F4DBC8_7F48_3E99_41CE_DEA2821BF714"],"data":{"label":"3Vnull-03-09_14-17-23_screenshot"},"label":trans('panorama_743170D8_7F48_6AB8_41C0_AAC239AE8EF7.label'),"frames":[{"thumbnailUrl":"media/panorama_743170D8_7F48_6AB8_41C0_AAC239AE8EF7_t.webp","class":"CubicPanoramaFrame","cube":{"levels":[{"rowCount":4,"height":2048,"class":"TiledImageResourceLevel","colCount":24,"url":"media/panorama_743170D8_7F48_6AB8_41C0_AAC239AE8EF7_0/{face}/0/{row}_{column}.webp","width":12288,"tags":"ondemand"},{"rowCount":2,"height":1024,"class":"TiledImageResourceLevel","colCount":12,"url":"media/panorama_743170D8_7F48_6AB8_41C0_AAC239AE8EF7_0/{face}/1/{row}_{column}.webp","width":6144,"tags":"ondemand"},{"rowCount":1,"height":512,"class":"TiledImageResourceLevel","colCount":6,"url":"media/panorama_743170D8_7F48_6AB8_41C0_AAC239AE8EF7_0/{face}/2/{row}_{column}.webp","width":3072,"tags":["ondemand","preload"]}],"class":"ImageResource"}}]},{"id":"mainPlayList","items":[{"camera":"this.panorama_725CAFF3_71D8_1414_41C8_EBAEFE1538B9_camera","class":"PanoramaPlayListItem","media":"this.panorama_725CAFF3_71D8_1414_41C8_EBAEFE1538B9","player":"this.MainViewerPanoramaPlayer","begin":"this.setEndToItemIndex(this.mainPlayList, 0, 1)"},{"media":"this.album_700679A8_71D8_3C35_41D0_C26DCC2E94B9","begin":"this.setEndToItemIndex(this.mainPlayList, 1, 2)","class":"PhotoAlbumPlayListItem","player":"this.MainViewerPhotoAlbumPlayer"},{"camera":"this.panorama_743170D8_7F48_6AB8_41C0_AAC239AE8EF7_camera","class":"PanoramaPlayListItem","media":"this.panorama_743170D8_7F48_6AB8_41C0_AAC239AE8EF7","end":"this.trigger('tourEnded')","player":"this.MainViewerPanoramaPlayer","begin":"this.setEndToItemIndex(this.mainPlayList, 2, 0)"}],"class":"PlayList"},{"initialPosition":{"pitch":0,"class":"PanoramaCameraPosition","yaw":0},"initialSequence":"this.sequence_76722E8C_7F48_1698_41D2_F3F72C2E48BA","enterPointingToHorizon":true,"class":"PanoramaCamera","id":"panorama_743170D8_7F48_6AB8_41C0_AAC239AE8EF7_camera"},{"id":"MainViewerPhotoAlbumPlayer","viewerArea":"this.MainViewer","class":"PhotoAlbumPlayer"},{"hfovMin":"150%","hfov":360,"vfov":180,"id":"panorama_725CAFF3_71D8_1414_41C8_EBAEFE1538B9","thumbnailUrl":"media/panorama_725CAFF3_71D8_1414_41C8_EBAEFE1538B9_t.webp","hfovMax":130,"class":"Panorama","overlays":["this.overlay_724FF898_71D8_1C14_41C4_035DC712F75C","this.overlay_76D62A36_7F78_7988_41B1_2367F2EA892B"],"data":{"label":"Starting area"},"label":trans('panorama_725CAFF3_71D8_1414_41C8_EBAEFE1538B9.label'),"frames":[{"thumbnailUrl":"media/panorama_725CAFF3_71D8_1414_41C8_EBAEFE1538B9_t.webp","class":"CubicPanoramaFrame","cube":{"levels":[{"rowCount":4,"height":2048,"class":"TiledImageResourceLevel","colCount":24,"url":"media/panorama_725CAFF3_71D8_1414_41C8_EBAEFE1538B9_0/{face}/0/{row}_{column}.webp","width":12288,"tags":"ondemand"},{"rowCount":2,"height":1024,"class":"TiledImageResourceLevel","colCount":12,"url":"media/panorama_725CAFF3_71D8_1414_41C8_EBAEFE1538B9_0/{face}/1/{row}_{column}.webp","width":6144,"tags":"ondemand"},{"rowCount":1,"height":512,"class":"TiledImageResourceLevel","colCount":6,"url":"media/panorama_725CAFF3_71D8_1414_41C8_EBAEFE1538B9_0/{face}/2/{row}_{column}.webp","width":3072,"tags":["ondemand","preload"]}],"class":"ImageResource"}}]},{"surfaceReticleColor":"#FFFFFF","playbackBarHeadBorderSize":0,"toolTipFontSize":"1.11vmin","width":"100%","progressHeight":2,"progressBorderSize":0,"playbackBarBackgroundColor":["#FFFFFF"],"playbackBarHeight":10,"subtitlesTop":0,"progressBarBorderSize":0,"subtitlesBottom":50,"progressBarBorderRadius":2,"playbackBarProgressBorderSize":0,"playbackBarHeadWidth":6,"subtitlesTextShadowColor":"#000000","playbackBarRight":0,"subtitlesTextShadowOpacity":1,"playbackBarBackgroundColorDirection":"vertical","playbackBarProgressBorderRadius":0,"vrPointerColor":"#FFFFFF","vrThumbstickRotationStep":20,"progressBorderRadius":2,"progressLeft":"33%","toolTipBackgroundColor":"#F6F6F6","data":{"name":"Main Viewer"},"toolTipPaddingRight":6,"surfaceReticleSelectionColor":"#FFFFFF","playbackBarProgressBackgroundColor":["#3399FF"],"playbackBarHeadShadowOpacity":0.7,"subtitlesFontSize":"3vmin","subtitlesBackgroundOpacity":0.2,"toolTipFontColor":"#606060","toolTipFontFamily":"Arial","playbackBarBorderColor":"#FFFFFF","subtitlesBorderColor":"#FFFFFF","firstTransitionDuration":0,"playbackBarProgressBorderColor":"#000000","playbackBarBorderRadius":0,"playbackBarProgressBackgroundColorRatios":[0],"subtitlesFontFamily":"Arial","playbackBarHeadShadowHorizontalLength":0,"playbackBarHeadBorderRadius":0,"propagateClick":false,"playbackBarHeadBorderColor":"#000000","toolTipTextShadowColor":"#000000","playbackBarHeadShadowVerticalLength":0,"vrPointerSelectionTime":2000,"playbackBarBorderSize":0,"subtitlesTextShadowVerticalLength":1,"vrPointerSelectionColor":"#FF6600","class":"ViewerArea","subtitlesTextShadowHorizontalLength":1,"subtitlesBackgroundColor":"#000000","id":"MainViewer","subtitlesGap":0,"playbackBarHeadShadowBlurRadius":3,"playbackBarBackgroundOpacity":1,"progressBackgroundColorRatios":[0],"toolTipBorderColor":"#767676","playbackBarLeft":0,"progressRight":"33%","minWidth":100,"progressOpacity":0.7,"minHeight":50,"playbackBarHeadHeight":15,"progressBarBackgroundColorRatios":[0],"playbackBarHeadShadowColor":"#000000","toolTipPaddingLeft":6,"progressBarBackgroundColorDirection":"horizontal","playbackBarHeadShadow":true,"progressBarBorderColor":"#000000","toolTipPaddingTop":4,"playbackBarHeadBackgroundColorRatios":[0,1],"progressBorderColor":"#000000","playbackBarHeadBackgroundColor":["#111111","#666666"],"toolTipPaddingBottom":4,"subtitlesFontColor":"#FFFFFF","progressBarBackgroundColor":["#3399FF"],"progressBackgroundColor":["#000000"],"playbackBarBottom":5,"progressBottom":10,"height":"100%","toolTipShadowColor":"#333138"},{"data":{"label":"Photo Album Vnull-03-26_15-12-08_screenshot"},"playList":"this.album_700679A8_71D8_3C35_41D0_C26DCC2E94B9_AlbumPlayList","class":"PhotoAlbum","label":trans('album_700679A8_71D8_3C35_41D0_C26DCC2E94B9.label'),"id":"album_700679A8_71D8_3C35_41D0_C26DCC2E94B9","thumbnailUrl":"media/album_700679A8_71D8_3C35_41D0_C26DCC2E94B9_t.png"},{"data":{"label":"Vnull-03-26_15-12-08_screenshot"},"thumbnailUrl":"media/album_700679A8_71D8_3C35_41D0_C26DCC2E94B9_0_t.webp","height":2880,"duration":5000,"class":"Photo","label":trans('album_700679A8_71D8_3C35_41D0_C26DCC2E94B9_0.label'),"id":"album_700679A8_71D8_3C35_41D0_C26DCC2E94B9_0","image":{"levels":[{"url":"media/album_700679A8_71D8_3C35_41D0_C26DCC2E94B9_0.webp","class":"ImageResourceLevel"}],"class":"ImageResource"},"width":5760},{"timeToIdle":10000,"initialPosition":{"pitch":-5.53,"class":"PanoramaCameraPosition","yaw":55.21},"initialSequence":"this.sequence_6D1F2E72_71D8_3415_41D5_CFCC645B8C6C","enterPointingToHorizon":true,"class":"PanoramaCamera","idleSequence":"this.sequence_6D1F2E72_71D8_3415_41D5_CFCC645B8C6C","id":"panorama_725CAFF3_71D8_1414_41C8_EBAEFE1538B9_camera"},{"mouseControlMode":"drag_rotation","aaEnabled":true,"arrowKeysAction":"translate","touchControlMode":"drag_rotation","class":"PanoramaPlayer","id":"MainViewerPanoramaPlayer","viewerArea":"this.MainViewer","displayPlaybackBar":true,"keepModel3DLoadedWithoutLocation":true},{"id":"audiores_76887E08_7F58_F963_41C4_62CA1FA327C0","class":"AudioResource","mp3Url":trans('audiores_76887E08_7F58_F963_41C4_62CA1FA327C0.mp3Url')},{"data":{"label":"Arrow 01a","hasPanoramaAction":true},"maps":[],"areas":["this.HotspotPanoramaOverlayArea_75886698_7F48_36B8_41D0_B0A5177CA5AF"],"items":[{"pitch":-27.79,"distance":100,"yaw":179.63,"scaleMode":"fit_inside","class":"HotspotPanoramaOverlayImage","hfov":13.17,"image":"this.AnimatedImageResource_758CFC03_7F58_3952_41D3_4D960A967154","vfov":11.2,"data":{"label":"Arrow 01a"}}],"enabledInVR":true,"class":"HotspotPanoramaOverlay","useHandCursor":true,"id":"overlay_758FF68F_7F48_3697_41D1_E86A048611D9"},{"enabledInVR":true,"maps":[],"areas":["this.HotspotPanoramaOverlayArea_76C92C9D_7F48_3ABB_41C6_3BD2A0208685"],"items":[{"pitch":-84.56,"distance":50,"roll":170.01,"yaw":170.81,"hfov":27.13,"data":{"label":"Untitled_design__2_-removebg-preview (1)"},"class":"HotspotPanoramaOverlayImage","scaleMode":"fit_inside","image":"this.res_76DBBCC7_7F58_1A86_4198_E827B48591FA","vfov":24.45}],"data":{"label":"Untitled_design__2_-removebg-preview (1)"},"class":"HotspotPanoramaOverlay","useHandCursor":true,"id":"overlay_75F4DBC8_7F48_3E99_41CE_DEA2821BF714"},{"movements":[{"yawSpeed":7.96,"easing":"cubic_in","class":"DistancePanoramaCameraMovement","yawDelta":18.5},{"yawSpeed":7.96,"class":"DistancePanoramaCameraMovement","yawDelta":323},{"yawSpeed":7.96,"easing":"cubic_out","class":"DistancePanoramaCameraMovement","yawDelta":18.5}],"class":"PanoramaCameraSequence","id":"sequence_76722E8C_7F48_1698_41D2_F3F72C2E48BA"},{"enabledInVR":true,"maps":[],"areas":["this.HotspotPanoramaOverlayArea_7381A8D0_71D8_1C14_41D7_105D356410C3"],"items":[{"pitch":-40.17,"distance":100,"yaw":53.61,"scaleMode":"fit_inside","class":"HotspotPanoramaOverlayImage","hfov":10.5,"image":"this.AnimatedImageResource_758C6C03_7F58_3952_41C0_68D30BAD0FEE","vfov":5.73,"data":{"label":"Arrow 01a"}}],"data":{"label":"Arrow 01a"},"class":"HotspotPanoramaOverlay","useHandCursor":true,"id":"overlay_724FF898_71D8_1C14_41C4_035DC712F75C"},{"enabledInVR":true,"maps":[],"areas":["this.HotspotPanoramaOverlayArea_7642CB1A_7F78_7FB9_41B8_DD926DD4DE05"],"items":[{"pitch":-84.88,"distance":50,"vfov":37.54,"yaw":129.85,"hfov":44.31,"data":{"label":"Untitled_design__2_-removebg-preview (1)"},"class":"HotspotPanoramaOverlayImage","rotationY":7.38,"image":"this.res_76DBBCC7_7F58_1A86_4198_E827B48591FA","roll":78.39,"scaleMode":"fit_inside"}],"data":{"label":"Untitled_design__2_-removebg-preview (1)"},"class":"HotspotPanoramaOverlay","useHandCursor":true,"id":"overlay_76D62A36_7F78_7988_41B1_2367F2EA892B"},{"id":"album_700679A8_71D8_3C35_41D0_C26DCC2E94B9_AlbumPlayList","items":[{"camera":{"initialPosition":{"class":"PhotoCameraPosition"},"class":"MovementPhotoCamera","duration":5000,"scaleMode":"fit_outside","targetPosition":{"y":0.51,"x":0.28,"class":"PhotoCameraPosition","zoomFactor":1.1}},"class":"PhotoPlayListItem","media":"this.album_700679A8_71D8_3C35_41D0_C26DCC2E94B9_0"}],"class":"PhotoPlayList"},{"movements":[{"yawSpeed":7.96,"easing":"cubic_in","class":"DistancePanoramaCameraMovement","yawDelta":18.5},{"yawSpeed":7.96,"class":"DistancePanoramaCameraMovement","yawDelta":323},{"yawSpeed":7.96,"easing":"cubic_out","class":"DistancePanoramaCameraMovement","yawDelta":18.5}],"class":"PanoramaCameraSequence","id":"sequence_6D1F2E72_71D8_3415_41D5_CFCC645B8C6C"},{"displayTooltipInTouchScreens":true,"click":"this.setPlayListSelectedIndex(this.mainPlayList, 0)","class":"HotspotPanoramaOverlayArea","mapColor":"any","id":"HotspotPanoramaOverlayArea_75886698_7F48_36B8_41D0_B0A5177CA5AF"},{"rowCount":3,"colCount":3,"levels":[{"height":180,"class":"ImageResourceLevel","url":"media/res_76D91CC4_7F58_1AFA_41D3_FBC19A6ED690_0.webp","width":330}],"frameDuration":62,"finalFrame":"first","class":"AnimatedImageResource","id":"AnimatedImageResource_758CFC03_7F58_3952_41D3_4D960A967154","frameCount":9},{"id":"HotspotPanoramaOverlayArea_76C92C9D_7F48_3ABB_41C6_3BD2A0208685","displayTooltipInTouchScreens":true,"class":"HotspotPanoramaOverlayArea","mapColor":"any"},{"id":"res_76DBBCC7_7F58_1A86_4198_E827B48591FA","class":"ImageResource","levels":[{"height":500,"class":"ImageResourceLevel","url":"media/res_76DBBCC7_7F58_1A86_4198_E827B48591FA_0.webp","width":500}]},{"id":"HotspotPanoramaOverlayArea_7381A8D0_71D8_1C14_41D7_105D356410C3","displayTooltipInTouchScreens":true,"class":"HotspotPanoramaOverlayArea","mapColor":"any"},{"rowCount":3,"colCount":3,"levels":[{"height":180,"class":"ImageResourceLevel","url":"media/res_76D91CC4_7F58_1AFA_41D3_FBC19A6ED690_0.webp","width":330}],"frameDuration":62,"finalFrame":"first","class":"AnimatedImageResource","id":"AnimatedImageResource_758C6C03_7F58_3952_41C0_68D30BAD0FEE","frameCount":9},{"id":"HotspotPanoramaOverlayArea_7642CB1A_7F78_7FB9_41B8_DD926DD4DE05","displayTooltipInTouchScreens":true,"class":"HotspotPanoramaOverlayArea","mapColor":"any"}],"layout":"absolute","scripts":{"triggerOverlay":TDV.Tour.Script.triggerOverlay,"setSurfaceSelectionHotspotMode":TDV.Tour.Script.setSurfaceSelectionHotspotMode,"getCurrentPlayers":TDV.Tour.Script.getCurrentPlayers,"getGlobalAudio":TDV.Tour.Script.getGlobalAudio,"setValue":TDV.Tour.Script.setValue,"getPlayListItems":TDV.Tour.Script.getPlayListItems,"getCurrentPlayerWithMedia":TDV.Tour.Script.getCurrentPlayerWithMedia,"clone":TDV.Tour.Script.clone,"quizPauseTimer":TDV.Tour.Script.quizPauseTimer,"setPlayListSelectedIndex":TDV.Tour.Script.setPlayListSelectedIndex,"getAudioByTags":TDV.Tour.Script.getAudioByTags,"getFirstPlayListWithMedia":TDV.Tour.Script.getFirstPlayListWithMedia,"textToSpeechComponent":TDV.Tour.Script.textToSpeechComponent,"openLink":TDV.Tour.Script.openLink,"copyToClipboard":TDV.Tour.Script.copyToClipboard,"toggleTextToSpeechComponent":TDV.Tour.Script.toggleTextToSpeechComponent,"assignObjRecursively":TDV.Tour.Script.assignObjRecursively,"setOverlaysVisibilityByTags":TDV.Tour.Script.setOverlaysVisibilityByTags,"setPanoramaCameraWithSpot":TDV.Tour.Script.setPanoramaCameraWithSpot,"getPlayListWithItem":TDV.Tour.Script.getPlayListWithItem,"getActivePlayersWithViewer":TDV.Tour.Script.getActivePlayersWithViewer,"clonePanoramaCamera":TDV.Tour.Script.clonePanoramaCamera,"getPlayListsWithMedia":TDV.Tour.Script.getPlayListsWithMedia,"quizShowScore":TDV.Tour.Script.quizShowScore,"getActivePlayerWithViewer":TDV.Tour.Script.getActivePlayerWithViewer,"setDirectionalPanoramaAudio":TDV.Tour.Script.setDirectionalPanoramaAudio,"setPanoramaCameraWithCurrentSpot":TDV.Tour.Script.setPanoramaCameraWithCurrentSpot,"_initTwinsViewer":TDV.Tour.Script._initTwinsViewer,"setObjectsVisibilityByTags":TDV.Tour.Script.setObjectsVisibilityByTags,"restartTourWithoutInteraction":TDV.Tour.Script.restartTourWithoutInteraction,"setOverlayBehaviour":TDV.Tour.Script.setOverlayBehaviour,"getActiveMediaWithViewer":TDV.Tour.Script.getActiveMediaWithViewer,"getPixels":TDV.Tour.Script.getPixels,"setOverlaysVisibility":TDV.Tour.Script.setOverlaysVisibility,"cloneBindings":TDV.Tour.Script.cloneBindings,"copyObjRecursively":TDV.Tour.Script.copyObjRecursively,"setObjectsVisibilityByID":TDV.Tour.Script.setObjectsVisibilityByID,"executeFunctionWhenChange":TDV.Tour.Script.executeFunctionWhenChange,"setModel3DCameraSequence":TDV.Tour.Script.setModel3DCameraSequence,"_initSplitViewer":TDV.Tour.Script._initSplitViewer,"quizStart":TDV.Tour.Script.quizStart,"quizShowTimeout":TDV.Tour.Script.quizShowTimeout,"_getPlayListsWithViewer":TDV.Tour.Script._getPlayListsWithViewer,"getPlayListItemIndexByMedia":TDV.Tour.Script.getPlayListItemIndexByMedia,"setModel3DCameraWithCurrentSpot":TDV.Tour.Script.setModel3DCameraWithCurrentSpot,"setObjectsVisibility":TDV.Tour.Script.setObjectsVisibility,"syncPlaylists":TDV.Tour.Script.syncPlaylists,"setModel3DCameraSpot":TDV.Tour.Script.setModel3DCameraSpot,"getKey":TDV.Tour.Script.getKey,"executeJS":TDV.Tour.Script.executeJS,"getComponentByName":TDV.Tour.Script.getComponentByName,"setMapLocation":TDV.Tour.Script.setMapLocation,"initQuiz":TDV.Tour.Script.initQuiz,"stopAndGoCamera":TDV.Tour.Script.stopAndGoCamera,"initAnalytics":TDV.Tour.Script.initAnalytics,"initOverlayGroupRotationOnClick":TDV.Tour.Script.initOverlayGroupRotationOnClick,"quizShowQuestion":TDV.Tour.Script.quizShowQuestion,"setMediaBehaviour":TDV.Tour.Script.setMediaBehaviour,"executeAudioActionByTags":TDV.Tour.Script.executeAudioActionByTags,"init":TDV.Tour.Script.init,"quizSetItemFound":TDV.Tour.Script.quizSetItemFound,"setMainMediaByName":TDV.Tour.Script.setMainMediaByName,"cleanSelectedMeasurements":TDV.Tour.Script.cleanSelectedMeasurements,"setMainMediaByIndex":TDV.Tour.Script.setMainMediaByIndex,"setMeasurementUnits":TDV.Tour.Script.setMeasurementUnits,"setMeasurementsVisibility":TDV.Tour.Script.setMeasurementsVisibility,"quizFinish":TDV.Tour.Script.quizFinish,"executeAudioAction":TDV.Tour.Script.executeAudioAction,"getPanoramaOverlaysByTags":TDV.Tour.Script.getPanoramaOverlaysByTags,"toggleMeasurementsVisibility":TDV.Tour.Script.toggleMeasurementsVisibility,"takeScreenshot":TDV.Tour.Script.takeScreenshot,"toggleMeasurement":TDV.Tour.Script.toggleMeasurement,"changeOpacityWhilePlay":TDV.Tour.Script.changeOpacityWhilePlay,"cleanAllMeasurements":TDV.Tour.Script.cleanAllMeasurements,"changePlayListWithSameSpot":TDV.Tour.Script.changePlayListWithSameSpot,"downloadFile":TDV.Tour.Script.downloadFile,"changeBackgroundWhilePlay":TDV.Tour.Script.changeBackgroundWhilePlay,"setEndToItemIndex":TDV.Tour.Script.setEndToItemIndex,"startMeasurement":TDV.Tour.Script.startMeasurement,"getPanoramaOverlayByName":TDV.Tour.Script.getPanoramaOverlayByName,"stopMeasurement":TDV.Tour.Script.stopMeasurement,"startPanoramaWithModel":TDV.Tour.Script.startPanoramaWithModel,"setComponentsVisibilityByTags":TDV.Tour.Script.setComponentsVisibilityByTags,"playGlobalAudio":TDV.Tour.Script.playGlobalAudio,"getOverlaysByTags":TDV.Tour.Script.getOverlaysByTags,"getOverlaysByGroupname":TDV.Tour.Script.getOverlaysByGroupname,"startModel3DWithCameraSpot":TDV.Tour.Script.startModel3DWithCameraSpot,"setCameraSameSpotAsMedia":TDV.Tour.Script.setCameraSameSpotAsMedia,"startPanoramaWithCamera":TDV.Tour.Script.startPanoramaWithCamera,"setComponentVisibility":TDV.Tour.Script.setComponentVisibility,"playGlobalAudioWhilePlay":TDV.Tour.Script.playGlobalAudioWhilePlay,"playGlobalAudioWhilePlayActiveMedia":TDV.Tour.Script.playGlobalAudioWhilePlayActiveMedia,"sendAnalyticsData":TDV.Tour.Script.sendAnalyticsData,"showWindowBase":TDV.Tour.Script.showWindowBase,"fixTogglePlayPauseButton":TDV.Tour.Script.fixTogglePlayPauseButton,"getOverlays":TDV.Tour.Script.getOverlays,"createTween":TDV.Tour.Script.createTween,"autotriggerAtStart":TDV.Tour.Script.autotriggerAtStart,"showWindow":TDV.Tour.Script.showWindow,"stopTextToSpeech":TDV.Tour.Script.stopTextToSpeech,"pauseGlobalAudios":TDV.Tour.Script.pauseGlobalAudios,"_getObjectsByTags":TDV.Tour.Script._getObjectsByTags,"playAudioList":TDV.Tour.Script.playAudioList,"pauseGlobalAudio":TDV.Tour.Script.pauseGlobalAudio,"stopGlobalAudios":TDV.Tour.Script.stopGlobalAudios,"stopGlobalAudio":TDV.Tour.Script.stopGlobalAudio,"getPlayListItemByMedia":TDV.Tour.Script.getPlayListItemByMedia,"isComponentVisible":TDV.Tour.Script.isComponentVisible,"createTweenModel3D":TDV.Tour.Script.createTweenModel3D,"historyGoForward":TDV.Tour.Script.historyGoForward,"getMediaHeight":TDV.Tour.Script.getMediaHeight,"pauseGlobalAudiosWhilePlayItem":TDV.Tour.Script.pauseGlobalAudiosWhilePlayItem,"getModel3DInnerObject":TDV.Tour.Script.getModel3DInnerObject,"showPopupImage":TDV.Tour.Script.showPopupImage,"getMediaWidth":TDV.Tour.Script.getMediaWidth,"showPopupPanoramaVideoOverlay":TDV.Tour.Script.showPopupPanoramaVideoOverlay,"pauseCurrentPlayers":TDV.Tour.Script.pauseCurrentPlayers,"resumeGlobalAudios":TDV.Tour.Script.resumeGlobalAudios,"registerKey":TDV.Tour.Script.registerKey,"htmlToPlainText":TDV.Tour.Script.htmlToPlainText,"textToSpeech":TDV.Tour.Script.textToSpeech,"resumePlayers":TDV.Tour.Script.resumePlayers,"getMediaFromPlayer":TDV.Tour.Script.getMediaFromPlayer,"showPopupPanoramaOverlay":TDV.Tour.Script.showPopupPanoramaOverlay,"loadFromCurrentMediaPlayList":TDV.Tour.Script.loadFromCurrentMediaPlayList,"toggleVR":TDV.Tour.Script.toggleVR,"openEmbeddedPDF":TDV.Tour.Script.openEmbeddedPDF,"unregisterKey":TDV.Tour.Script.unregisterKey,"showComponentsWhileMouseOver":TDV.Tour.Script.showComponentsWhileMouseOver,"getComponentsByTags":TDV.Tour.Script.getComponentsByTags,"mixObject":TDV.Tour.Script.mixObject,"historyGoBack":TDV.Tour.Script.historyGoBack,"disableVR":TDV.Tour.Script.disableVR,"existsKey":TDV.Tour.Script.existsKey,"skip3DTransitionOnce":TDV.Tour.Script.skip3DTransitionOnce,"quizResumeTimer":TDV.Tour.Script.quizResumeTimer,"showPopupMedia":TDV.Tour.Script.showPopupMedia,"shareSocial":TDV.Tour.Script.shareSocial,"setStartTimeVideoSync":TDV.Tour.Script.setStartTimeVideoSync,"visibleComponentsIfPlayerFlagEnabled":TDV.Tour.Script.visibleComponentsIfPlayerFlagEnabled,"getStateTextToSpeech":TDV.Tour.Script.getStateTextToSpeech,"enableVR":TDV.Tour.Script.enableVR,"getMainViewer":TDV.Tour.Script.getMainViewer,"updateVideoCues":TDV.Tour.Script.updateVideoCues,"getMediaByTags":TDV.Tour.Script.getMediaByTags,"_initTTSTooltips":TDV.Tour.Script._initTTSTooltips,"_initItemWithComps":TDV.Tour.Script._initItemWithComps,"getMediaByName":TDV.Tour.Script.getMediaByName,"translate":TDV.Tour.Script.translate,"keepCompVisible":TDV.Tour.Script.keepCompVisible,"updateIndexGlobalZoomImage":TDV.Tour.Script.updateIndexGlobalZoomImage,"setStartTimeVideo":TDV.Tour.Script.setStartTimeVideo,"isPanorama":TDV.Tour.Script.isPanorama,"updateMediaLabelFromPlayList":TDV.Tour.Script.updateMediaLabelFromPlayList,"getRootOverlay":TDV.Tour.Script.getRootOverlay,"updateDeepLink":TDV.Tour.Script.updateDeepLink,"getQuizTotalObjectiveProperty":TDV.Tour.Script.getQuizTotalObjectiveProperty,"unloadViewer":TDV.Tour.Script.unloadViewer,"isCardboardViewMode":TDV.Tour.Script.isCardboardViewMode,"setLocale":TDV.Tour.Script.setLocale},"backgroundColorRatios":[0],"scrollBarMargin":2,"minWidth":0,"minHeight":0,"gap":10,"height":"100%","width":"100%","scrollBarColor":"#000000","propagateClick":false};
if (script['data'] == undefined)
    script['data'] = {};
script['data']['translateObjs'] = translateObjs, script['data']['createQuizConfig'] = function () {
    let a = {}, b = this['get']('data')['translateObjs'];
    for (const c in translateObjs) {
        if (!b['hasOwnProperty'](c))
            b[c] = translateObjs[c];
    }
    return a;
}, TDV['PlayerAPI']['defineScript'](script);
//# sourceMappingURL=script_device.js.map
})();
//Generated with v2026.0.6, Tue Apr 7 2026